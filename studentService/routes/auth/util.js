const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const axios = require("axios");
const { ROLES, AUTH_SERVICE_JWKS_URL } = require("../../../consts");

dotenv.config();

async function fetchJWKS() {
  try {
    const response = await axios.get(AUTH_SERVICE_JWKS_URL);
    if (!response.data || !response.data.keys) {
      throw new Error("JWKS response from auth service is malformed.");
    }
    return response.data.keys;
  } catch (error) {
    console.error("Error fetching JWKS:", error.message);
    if (error.isAxiosError) {
      console.error("Axios error details:", error.toJSON());
    }
    throw new Error(`Unable to fetch JWKS from auth service at ${AUTH_SERVICE_JWKS_URL}.`);
  }
}

function getPublicKeyFromJWKS(kid, jwksKeys) {
  const key = jwksKeys.find((k) => k.kid === kid);
  if (!key) {
    throw new Error("Unable to find a signing key in JWKS that matches the JWT's 'kid'.");
  }
  if (!key.n) {
    throw new Error("Public key modulus (n) not found in JWK from JWKS.");
  }
  return `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
}

async function verifyJWTWithJWKS(token) {
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header) {
    throw new Error("Invalid JWT token: Cannot decode header.");
  }
  const { kid, alg } = decodedHeader.header;

  if (!kid) {
    throw new Error("JWT header is missing 'kid' (Key ID).");
  }

  if (alg !== "RS256") {
    throw new Error(`Unsupported JWT algorithm: ${alg}. Expected RS256.`);
  }

  const jwksKeys = await fetchJWKS();
  const publicKeyPEM = getPublicKeyFromJWKS(kid, jwksKeys);

  return new Promise((resolve, reject) => {
    jwt.verify(token, publicKeyPEM, { algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
}

function verifyRole(requiredRoles) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization token is missing or malformed. Expected 'Bearer <token>'." });
    }
    const token = authHeader.split(" ")[1];

    try {
      const decodedPayload = await verifyJWTWithJWKS(token);
      req.user = decodedPayload;

      const userRoles = req.user.roles || [];
      const hasRequiredRole = userRoles.some((role) =>
        requiredRoles.includes(role)
      );

      if (hasRequiredRole) {
        return next();
      } else {
        return res
          .status(403)
          .json({ message: "Access forbidden: Insufficient role." });
      }
    } catch (error) {
      console.error("Token verification or role check error:", error.message);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.message.includes("kid") || error.message.includes("JWKS")) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token.", error: error.message });
      }
      return res.status(500).json({ message: "Internal server error during token verification.", error: error.message });
    }
  };
}

function restrictStudentToOwnData(req, res, next) {
  if (!req.user || !req.user.userId || !req.user.roles) {
    return res.status(401).json({ message: "User information not available from token. Cannot perform ownership check." });
  }

  if (req.user.roles.includes(ROLES.PROFESSOR) || req.user.roles.includes(ROLES.ADMIN)) {
    return next();
  }

  if (req.user.roles.includes(ROLES.STUDENT)) {
    if (req.user.userId === req.params.id) {
      return next();
    } else {
      return res.status(403).json({
        message: "Access forbidden: Students can only access their own data.",
      });
    }
  }

  return res.status(403).json({ message: "Access forbidden due to role mismatch or ownership criteria." });
}

module.exports = {
  verifyRole,
  restrictStudentToOwnData,
};