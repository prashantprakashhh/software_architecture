// const AUTH_SERVICE = "http://localhost:5001/api/login";

// const PROFESSOR__SERVICE = "http://localhost:5002/api/professors";

// const STUDENT_SERVICE = "http://localhost:5003/api/students";

// const COURSE_SERVICE = "http://localhost:5004/api/courses";

// // roles.js
// const ROLES = Object.freeze({
//   STUDENT: "student",
//   PROFESSOR: "professor",
//   ADMIN: "admin",
//   AUTH_SERVICE: "auth_service",
//   ENROLLMENT_SERVICE: "enrollment_service",
// });

// module.exports = {
//   AUTH_SERVICE,
//   STUDENT_SERVICE,
//   PROFESSOR__SERVICE,
//   COURSE_SERVICE,
//   ROLES,
// };


const AUTH_SERVICE_BASE_URL = "http://localhost:5001"; // Base URL for authService
const AUTH_SERVICE_LOGIN_URL = `${AUTH_SERVICE_BASE_URL}/api/login`; // Specific login endpoint
const AUTH_SERVICE_JWKS_URL = `${AUTH_SERVICE_BASE_URL}/.well-known/jwks.json`; // JWKS endpoint for authService

const PROFESSOR_SERVICE_URL = "http://localhost:5002/api/professors";
const STUDENT_SERVICE_URL = "http://localhost:5003/api/students";
const COURSE_SERVICE_URL = "http://localhost:5004/api/courses";

// Roles
const ROLES = Object.freeze({
  STUDENT: "student", // Ensure these string values match what's in your JWT 'roles' array
  PROFESSOR: "professor",
  ADMIN: "admin",
  AUTH_SERVICE: "auth_service", // Example for service-to-service
  ENROLLMENT_SERVICE: "enrollment_service", // Example for service-to-service
});

module.exports = {
  AUTH_SERVICE_LOGIN_URL, // Kept if other services use the direct login URL
  AUTH_SERVICE_JWKS_URL,  // New: For services to verify JWTs
  STUDENT_SERVICE_URL,    // Renamed for clarity if you prefer (e.g., from STUDENT_SERVICE)
  PROFESSOR_SERVICE_URL,  // Renamed for clarity
  COURSE_SERVICE_URL,     // Renamed for clarity
  ROLES,
};
