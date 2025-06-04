// const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
// const axios = require("axios");
// const fs = require("fs");
// const path = require("path");

// const { ROLES, STUDENT_SERVICE, COURSE_SERVICE } = require("../../../consts");
// // const { getCorrelationId } = require("../../../correlationId");

// dotenv.config();

// const axiosInstance = axios.create();

// // axiosInstance.interceptors.request.use(
// //   (req) => {
// //     const correlationId = getCorrelationId(); // Retrieve the correlation ID
// //     req.headers["x-correlation-id"] = correlationId; // Add it to the headers
// //     return req;
// //   },
// //   (error) => {
// //     return Promise.reject(error);
// //   }
// // );
// const kid = "1";
// const jku = `http://localhost:${process.env.PORT}/.well-known/jwks.json`;

// // Define additional headers
// const customHeaders = {
//   kid, // Replace with the actual Key ID
//   jku, // Replace with your JWKS URL
// };

// // Path to your private and public keys
// const privateKey = fs.readFileSync(
//   path.join(__dirname, "../auth/keys/private.key"),
//   "utf8"
// );
// const publicKey = fs.readFileSync(
//   path.join(__dirname, "../auth/keys/public.key"),
//   "utf8"
// );
// /**
//  * Fetch the JWKS from a given URI.
//  * @param {string} jku - The JWKS URI from the JWT header.
//  * @returns {Promise<Array>} - A promise that resolves to the JWKS keys.
//  */
// async function fetchJWKS(jku) {
//   const response = await axios.get(jku);
//   return response.data.keys;
// }

// /**
//  * Get the public key from JWKS.
//  * @param {string} kid - The key ID from the JWT header.
//  * @param {Array} keys - The JWKS keys.
//  * @returns {string} - The corresponding public key in PEM format.
//  */
// function getPublicKeyFromJWKS(kid, keys) {
//   const key = keys.find((k) => k.kid === kid);

//   if (!key) {
//     throw new Error("Unable to find a signing key that matches the 'kid'");
//   }

//   return `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
// }

// /**
//  * Verify a JWT token using the JWKS URI in the `jku` header.
//  * @param {string} token - The JWT token to verify.
//  * @returns {Promise<object>} - A promise that resolves to the decoded JWT payload.
//  */
// async function verifyJWTWithJWKS(token) {
//   const decodedHeader = jwt.decode(token, { complete: true }).header;
//   const { kid, alg, jku } = decodedHeader;

//   if (!kid || !jku) {
//     throw new Error("JWT header is missing 'kid' or 'jku'");
//   }

//   if (alg !== "RS256") {
//     throw new Error(`Unsupported algorithm: ${alg}`);
//   }

//   const keys = await fetchJWKS(jku);
//   const publicKey = getPublicKeyFromJWKS(kid, keys);

//   return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
// }

// //TODO: Handle the private key generation
// // Generate a JWT using the private key
// function generateJWTWithPrivateKey(payload) {
//   // Sign the JWT using RS256 (asymmetric encryption)
//   const token = jwt.sign(payload, privateKey, {
//     algorithm: "RS256",
//     header: customHeaders,
//     expiresIn: "6h", // Set expiration
//   });
//   return token;
// }

// // Role-based Access Control Middleware
// function verifyRole(requiredRoles) {
//   return async (req, res, next) => {
//     const token =
//       req.headers.authorization && req.headers.authorization.split(" ")[1]; // Extract token from 'Bearer <token>'

//     if (!token) {
//       return res
//         .status(401)
//         .json({ message: "Authorization token is missing" });
//     }

//     try {
//       // Step 1: Verify the JWT token using JWKS
//       const decoded = await verifyJWTWithJWKS(token); // Decode the token and get the payload
//       req.user = decoded; // Attach the decoded payload (user data) to the request object

//       // Step 2: Check if the user has any of the required roles
//       const userRoles = req.user.roles || [];
//       const hasRequiredRole = userRoles.some((role) =>
//         requiredRoles.includes(role)
//       );
//       if (hasRequiredRole) {
//         return next(); // User has at least one of the required roles, so proceed
//       } else {
//         return res
//           .status(403)
//           .json({ message: "Access forbidden: Insufficient role" });
//       }
//     } catch (error) {
//       console.error(error);
//       return res
//         .status(403)
//         .json({ message: "Invalid or expired token", error: error.message });
//     }
//   };
// }

// async function fetchStudents() {
//   let token = generateJWTWithPrivateKey({
//     id: ROLES.ENROLLMENT_SERVICE,
//     roles: [ROLES.ENROLLMENT_SERVICE],
//   });
//   const response = await axiosInstance.get(`${STUDENT_SERVICE}`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return response.data;
// }

// async function fetchCourses() {
//   let token = generateJWTWithPrivateKey({
//     id: ROLES.ENROLLMENT_SERVICE,
//     roles: [ROLES.ENROLLMENT_SERVICE],
//   });
//   const response = await axiosInstance.get(`${COURSE_SERVICE}`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return response.data;
// }

// function restrictStudentToOwnData(req, res, next) {
//   if (req.user.roles.includes(ROLES.STUDENT) && req.user.id !== req.params.id) {
//     return res.status(403).json({
//       message: "Access forbidden: You can only access your own data",
//     });
//   }
//   next();
// }

// module.exports = {
//   kid,
//   verifyRole,
//   restrictStudentToOwnData,
//   fetchStudents,
//   fetchCourses,
// };


const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Correctly destructure the URLs from consts.js
const { ROLES, STUDENT_SERVICE_URL, COURSE_SERVICE_URL } = require("../../../consts");
// const { getCorrelationId } = require("../../../correlationId"); // Uncomment if you implement correlation IDs

dotenv.config(); // Ensures .env variables are loaded

const axiosInstance = axios.create();

// Example for correlation ID if you decide to use it
// axiosInstance.interceptors.request.use(
//   (req) => {
//     const correlationId = getCorrelationId(); // Retrieve the correlation ID
//     if (correlationId) { // Check if correlationId is available
//        req.headers["x-correlation-id"] = correlationId; // Add it to the headers
//     }
//     return req;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

const kid = "1"; // Key ID for JWKS
// jku should point to this service's JWKS endpoint if this service issues tokens that others verify via its JWKS
const jku = `http://localhost:${process.env.PORT || 5002}/.well-known/jwks.json`; // Added fallback for PORT

// Define additional headers for JWTs issued by this service
const customHeadersForIssuedTokens = {
  kid,
  jku,
};

// Path to your private and public keys for this service
let privateKey;
let publicKey;

try {
  privateKey = fs.readFileSync(
    path.join(__dirname, "../auth/keys/private.key"),
    "utf8"
  );
  publicKey = fs.readFileSync(
    path.join(__dirname, "../auth/keys/public.key"),
    "utf8"
  );
} catch (err) {
  console.error("Failed to read private or public key files:", err.message);
  console.error("Ensure 'private.key' and 'public.key' exist in 'enrollmentService/routes/auth/keys/'");
  // Depending on your application's needs, you might want to exit or throw a fatal error
  // For now, we'll let it proceed, but token generation/verification might fail
}


/**
 * Fetch the JWKS from a given URI.
 * @param {string} jwksUri - The JWKS URI from the JWT header.
 * @returns {Promise<Array>} - A promise that resolves to the JWKS keys.
 */
async function fetchJWKS(jwksUri) {
  try {
    const response = await axiosInstance.get(jwksUri);
    if (response.data && response.data.keys) {
      return response.data.keys;
    }
    throw new Error("JWKS response did not contain keys.");
  } catch (error) {
    console.error(`Error fetching JWKS from ${jwksUri}:`, error.message);
    throw error; // Re-throw the error to be caught by the caller
  }
}

/**
 * Get the public key from JWKS.
 * @param {string} keyId - The key ID from the JWT header.
 * @param {Array} keys - The JWKS keys.
 * @returns {string} - The corresponding public key in PEM format.
 */
function getPublicKeyFromJWKS(keyId, keys) {
  const key = keys.find((k) => k.kid === keyId);

  if (!key) {
    throw new Error(`Unable to find a signing key in JWKS that matches the 'kid': ${keyId}`);
  }

  // Assuming the key in JWKS is a standard RSA public key components (n, e) or a full PEM.
  // If 'key.n' is just the modulus, you'd need to construct the PEM.
  // For simplicity, if your JWKS provides the full key in a standard format like x5c, use that.
  // If key.n is the base64url encoded modulus, and key.e is the exponent,
  // you would typically use a library to convert this to PEM.
  // The example `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`
  // is often an oversimplification unless key.n is already the full base64 encoded DER public key.
  // For now, let's assume key.publicKey or key.x5c might be available, or a library handles this.
  // If using node-jose or similar, it handles this conversion.
  // Given the current structure, we'll stick to the original logic but acknowledge its potential limitations.
  if (key.n) { // This is a simplified assumption
      return `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
  }
  // A more robust solution would use a library like 'jwk-to-pem'
  // const jwkToPem = require('jwk-to-pem');
  // return jwkToPem(key);
  throw new Error("Public key format in JWKS not directly usable or 'n' component missing.");
}

/**
 * Verify a JWT token using the JWKS URI in the `jku` header.
 * @param {string} token - The JWT token to verify.
 * @returns {Promise<object>} - A promise that resolves to the decoded JWT payload.
 */
async function verifyJWTWithJWKS(token) {
  const decodedHeader = jwt.decode(token, { complete: true }).header;
  const { kid: tokenKid, alg, jku: tokenJku } = decodedHeader;

  if (!tokenKid || !tokenJku) {
    throw new Error("JWT header is missing 'kid' or 'jku'");
  }

  if (alg !== "RS256") {
    throw new Error(`Unsupported algorithm: ${alg}. Expected RS256.`);
  }

  const keys = await fetchJWKS(tokenJku);
  const signingPublicKey = getPublicKeyFromJWKS(tokenKid, keys);

  return jwt.verify(token, signingPublicKey, { algorithms: ["RS256"] });
}

/**
 * Generate a JWT using this service's private key.
 * @param {object} payload - The payload for the JWT.
 * @returns {string} - The generated JWT.
 */
function generateJWTWithPrivateKey(payload) {
  if (!privateKey) {
    console.error("Private key is not loaded. Cannot generate JWT.");
    throw new Error("Private key is not available for JWT generation.");
  }
  // Sign the JWT using RS256 (asymmetric encryption)
  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: customHeadersForIssuedTokens, // Use headers specific to tokens issued by this service
    expiresIn: "6h", // Set expiration
  });
  return token;
}

// Role-based Access Control Middleware
function verifyRole(requiredRoles) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization token is missing or malformed (Bearer token expected)" });
    }
    const token = authHeader.split(" ")[1];

    try {
      // Step 1: Verify the JWT token using JWKS from the token's 'jku' header
      const decoded = await verifyJWTWithJWKS(token);
      req.user = decoded; // Attach the decoded payload (user data) to the request object

      // Step 2: Check if the user has any of the required roles
      const userRoles = req.user.roles || []; // Ensure roles array exists
      const hasRequiredRole = userRoles.some((role) =>
        requiredRoles.includes(role)
      );

      if (hasRequiredRole) {
        return next(); // User has at least one of the required roles, so proceed
      } else {
        return res
          .status(403)
          .json({ message: "Access forbidden: Insufficient role" });
      }
    } catch (error) {
      console.error("Token verification or role check failed:", error.message);
      // Distinguish between different types of errors if possible
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Token expired", error: error.message });
      }
      if (error.message.includes("Unable to find a signing key") || error.message.includes("JWT header is missing")) {
         return res.status(403).json({ message: "Invalid token: Key or header issue", error: error.message });
      }
      return res
        .status(403) // Using 403 for "Forbidden" as authentication might be valid but token content/verification failed
        .json({ message: "Invalid or expired token", error: error.message });
    }
  };
}

async function fetchStudents() {
  console.log("Attempting to fetch students from:", STUDENT_SERVICE_URL);
  if (!STUDENT_SERVICE_URL || STUDENT_SERVICE_URL === "undefined/api/students" || STUDENT_SERVICE_URL === "undefined") {
    console.error("STUDENT_SERVICE_URL is not defined or invalid:", STUDENT_SERVICE_URL);
    throw new Error("Student service URL is misconfigured.");
  }
  try {
    const token = generateJWTWithPrivateKey({
      // Payload for the token this service sends to studentService
      // It should identify this service (enrollmentService)
      serviceName: "enrollmentService", // Or a specific ID
      roles: [ROLES.ENROLLMENT_SERVICE], // Role indicating this service's identity/permissions
    });

    const response = await axiosInstance.get(STUDENT_SERVICE_URL, { // Use the correctly imported URL
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching students from ${STUDENT_SERVICE_URL}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to fetch students from student service. Status: ${error.response ? error.response.status : 'N/A'}`);
  }
}

async function fetchCourses() {
  console.log("Attempting to fetch courses from:", COURSE_SERVICE_URL);
   if (!COURSE_SERVICE_URL || COURSE_SERVICE_URL === "undefined/api/courses" || COURSE_SERVICE_URL === "undefined") {
    console.error("COURSE_SERVICE_URL is not defined or invalid:", COURSE_SERVICE_URL);
    throw new Error("Course service URL is misconfigured.");
  }
  try {
    const token = generateJWTWithPrivateKey({
      // Payload for the token this service sends to courseService
      serviceName: "enrollmentService",
      roles: [ROLES.ENROLLMENT_SERVICE],
    });

    const response = await axiosInstance.get(COURSE_SERVICE_URL, { // Use the correctly imported URL
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching courses from ${COURSE_SERVICE_URL}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to fetch courses from course service. Status: ${error.response ? error.response.status : 'N/A'}`);
  }
}

// Middleware to restrict student access to their own data
function restrictStudentToOwnData(req, res, next) {
  // Ensure req.user and req.user.roles are populated by verifyRole middleware
  if (req.user && req.user.roles && req.user.roles.includes(ROLES.STUDENT)) {
    // req.user.id should be the student's own ID from the JWT payload
    // req.params.id is the ID from the URL path (e.g., /api/enrollments/student/:id)
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        message: "Access forbidden: You can only access your own data",
      });
    }
  }
  next();
}

module.exports = {
  kid, // Export 'kid' if it's needed by other modules (e.g. publicKeyRoute)
  publicKey, // Export 'publicKey' if it's needed by other modules (e.g. publicKeyRoute)
  verifyRole,
  restrictStudentToOwnData,
  fetchStudents,
  fetchCourses,
  generateJWTWithPrivateKey, // Potentially useful if other parts of this service need to generate tokens
  verifyJWTWithJWKS, // Potentially useful for advanced scenarios
};
