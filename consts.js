const AUTH_SERVICE_BASE_URL = "http://localhost:5001"; // Base URL for authService
const AUTH_SERVICE_LOGIN_URL = `${AUTH_SERVICE_BASE_URL}/api/login`; // Specific login endpoint
const AUTH_SERVICE_JWKS_URL = `${AUTH_SERVICE_BASE_URL}/.well-known/jwks.json`; // JWKS endpoint for authService

const PROFESSOR_SERVICE_URL = "http://localhost:5002/api/professors";
const STUDENT_SERVICE_URL = "http://localhost:5003/api/students";
const COURSE_SERVICE_URL = "http://localhost:5004/api/courses";
const ENROLLMENT_SERVICE_URL = "http://localhost:5005/api/enrollments"; // Example for enrollment service

// Roles
const ROLES = Object.freeze({
  STUDENT: "student", // Ensure these string values match what's in your JWT 'roles' array
  PROFESSOR: "professor",
  ADMIN: "admin",
  AUTH_SERVICE: "auth_service", // Example for service-to-service
  ENROLLMENT_SERVICE: "enrollment_service", // Example for service-to-service
});

module.exports = {
  AUTH_SERVICE_LOGIN_URL, 
  AUTH_SERVICE_JWKS_URL,  
  STUDENT_SERVICE_URL,    
  PROFESSOR_SERVICE_URL,  
  ENROLLMENT_SERVICE_URL,
  COURSE_SERVICE_URL,     
  ROLES,
};
