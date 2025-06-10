const axios = require("axios");
const jwt = require("jsonwebtoken");
const {
  AUTH_SERVICE_JWKS_URL,
  STUDENT_SERVICE_URL,
  COURSE_SERVICE_URL,
  ROLES,
} = require("../../../consts");

async function fetchJWKS() {
  try {
    const response = await axios.get(AUTH_SERVICE_JWKS_URL);
    if (!response.data || !response.data.keys) {
      throw new Error("JWKS response from auth service is malformed.");
    }
    return response.data.keys;
  } catch (error) {
    console.error("Error fetching JWKS:", error.message);
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
      return res.status(401).json({ message: "Authorization token is missing or malformed." });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decodedPayload = await verifyJWTWithJWKS(token);
      req.user = decodedPayload;
      const userRoles = req.user.roles || [];
      const hasRequiredRole = userRoles.some((role) => requiredRoles.includes(role));
      if (hasRequiredRole) {
        return next();
      } else {
        return res.status(403).json({ message: "Access forbidden: Insufficient role." });
      }
    } catch (error) {
      console.error("Token verification or role check error:", error.message);
      return res.status(401).json({ message: "Unauthorized: Invalid or expired token.", error: error.message });
    }
  };
}

function restrictStudentToOwnData(req, res, next) {
    if (req.user.roles.includes(ROLES.ADMIN) || req.user.roles.includes(ROLES.PROFESSOR)) {
        return next();
    }
    if (req.user.roles.includes(ROLES.STUDENT) && req.user.userId === req.params.id) {
        return next();
    }
    return res.status(403).json({ message: "Access forbidden: You can only access your own data." });
}

async function fetchStudents(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("Authorization header is required for fetching students.");
  }

  try {
    console.log(`Attempting to fetch students from: ${STUDENT_SERVICE_URL}`);
    const response = await axios.get(STUDENT_SERVICE_URL, {
      headers: {
        Authorization: authHeader, // Forward the original token
      },
    });
    return response.data;
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error(`Error fetching students from ${STUDENT_SERVICE_URL}:`, errorData);
    throw new Error(`Failed to fetch students from student service. Status: ${error.response ? error.response.status : 'unknown'}`);
  }
}

async function fetchCourses(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error("Authorization header is required for fetching courses.");
  }

  try {
    console.log(`Attempting to fetch courses from: ${COURSE_SERVICE_URL}`);
    const response = await axios.get(COURSE_SERVICE_URL, {
      headers: {
        Authorization: authHeader, // Forward the original token
      },
    });
    return response.data;
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error(`Error fetching courses from ${COURSE_SERVICE_URL}:`, errorData);
    throw new Error(`Failed to fetch courses from course service. Status: ${error.response ? error.response.status : 'unknown'}`);
  }
}

module.exports = {
  verifyRole,
  restrictStudentToOwnData,
  fetchStudents,
  fetchCourses,
};