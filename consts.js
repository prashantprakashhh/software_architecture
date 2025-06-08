const AUTH_SERVICE_BASE_URL = "http://localhost:5001"; 
const AUTH_SERVICE_LOGIN_URL = `${AUTH_SERVICE_BASE_URL}/api/login`;
const AUTH_SERVICE_JWKS_URL = `${AUTH_SERVICE_BASE_URL}/.well-known/jwks.json`; 
const PROFESSOR_SERVICE_URL = "http://localhost:5002/api/professors";
const STUDENT_SERVICE_URL = "http://localhost:5003/api/students";
const COURSE_SERVICE_URL = "http://localhost:5004/api/courses";
const ENROLLMENT_SERVICE_URL = "http://localhost:5005/api/enrollments"; 

// Roles
const ROLES = Object.freeze({
  STUDENT: "student", 
  PROFESSOR: "professor",
  ADMIN: "admin",
  AUTH_SERVICE: "auth_service", 
  ENROLLMENT_SERVICE: "enrollment_service", 
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
