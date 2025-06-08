const jwt = require("jsonwebtoken");
const axios = require("axios");
const { ROLES, AUTH_SERVICE_JWKS_URL } = require("../../../consts"); // Get ROLES and JWKS URL from root consts

/**
 * Fetch the JWKS from the authService.
 * @returns {Promise<Array>} - A promise that resolves to the JWKS keys.
 */
async function fetchJWKS() {
  try {
    // Use the globally configured AUTH_SERVICE_JWKS_URL
    const response = await axios.get(AUTH_SERVICE_JWKS_URL);
    if (!response.data || !response.data.keys) {
        throw new Error("JWKS response from auth service is malformed.");
    }
    return response.data.keys;
  } catch (error) {
    console.error("Error fetching JWKS:", error.message);
    // Log the full error if it's an axios error for more details
    if (error.isAxiosError) {
        console.error("Axios error details:", error.toJSON());
    }
    throw new Error(`Unable to fetch JWKS from auth service at ${AUTH_SERVICE_JWKS_URL}.`);
  }
}

/**
 * Get the public key from JWKS.
 * @param {string} kid - The key ID from the JWT header.
 * @param {Array} keys - The JWKS keys.
 * @returns {string} - The corresponding public key in PEM format.
 */
function getPublicKeyFromJWKS(kid, jwksKeys) {
  const key = jwksKeys.find((k) => k.kid === kid);

  if (!key) {
    throw new Error("Unable to find a signing key in JWKS that matches the JWT's 'kid'.");
  }

  // Your authService/routes/auth/publicKeyRoute.js creates 'n' as the base64 part of a PEM.
  // We need to reconstruct the PEM format for verification.
  if (!key.n) {
    throw new Error("Public key modulus (n) not found in JWK from JWKS.");
  }
  // This assumes 'n' is the base64 encoded body of a PEM public key (X.509 SubjectPublicKeyInfo)
  return `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
}

/**
 * Verify a JWT token using the JWKS from authService.
 * @param {string} token - The JWT token to verify.
 * @returns {Promise<object>} - A promise that resolves to the decoded JWT payload.
 */
async function verifyJWTWithJWKS(token) {
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header) {
    throw new Error("Invalid JWT token: Cannot decode header.");
  }
  const { kid, alg } = decodedHeader.header;

  if (!kid) {
    throw new Error("JWT header is missing 'kid' (Key ID).");
  }

  if (alg !== "RS256") { // Assuming your authService signs with RS256
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

// Role-based Access Control Middleware
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
        return next(); // User has at least one of the required roles, proceed
      } else {
        return res
          .status(403)
          .json({ message: "Access forbidden: Insufficient role." });
      }
    } catch (error) {
      console.error("Token verification or role check error:", error.message);
      // Differentiate between token validation errors and other errors
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.message.includes("kid") || error.message.includes("JWKS")) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token.", error: error.message });
      }
      return res.status(500).json({ message: "Internal server error during token verification.", error: error.message });
    }
  };
}




function restrictProfessorToOwnData(req, res, next) {
  // req.user should be populated by verifyRole middleware
  if (!req.user || !req.user.userId || !req.user.roles) {
    // This case should ideally be caught by verifyRole if token is invalid/missing essential claims
    return res.status(401).json({ message: "User information not available from token. Cannot perform ownership check." });
  }

  // If the user is an ADMIN, they can access/modify any professor's data
  if (req.user.roles.includes(ROLES.ADMIN)) {
    return next();
  }

  // If the user is a PROFESSOR, check if the requested resource ID matches their own ID
  if (req.user.roles.includes(ROLES.PROFESSOR)) {
    // req.params.id is the ID from the URL (e.g., /api/professors/:id)
    // req.user.userId is the ID from the JWT token
    if (req.user.userId === req.params.id) { 
      return next(); // Professor is accessing/modifying their own data
    } else {
      return res.status(403).json({
        message: "Access forbidden: Professors can only access or modify their own data.",
      });
    }
  }
  
  // If user is not ADMIN or (PROFESSOR with matching ID)
  // This path might be redundant if verifyRole already filters by PROFESSOR or ADMIN for these routes
  return res.status(403).json({ message: "Access forbidden due to role mismatch or ownership criteria." });
}

module.exports = {
  verifyRole,
  restrictProfessorToOwnData,
  fetchJWKS,
};