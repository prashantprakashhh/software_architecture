// const express = require("express");
// const bcrypt = require("bcryptjs"); 
// const dotenv = require("dotenv");

// const {
//   generateJWTWithPrivateKey, 
//   fetchStudents,
//   fetchProfessors,
// } = require("./util"); 
// const { ROLES } = require("../../../consts");

// const router = express.Router();

// dotenv.config();

// // Student Login
// router.post("/student", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     // Get the list of all students
//     const students = await fetchStudents(); 
//     const student = students.find((s) => s.email === email);

//     if (!student) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // Compare submitted password with stored hashed password
//     const isPasswordValid = await bcrypt.compare(password, student.password); //
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // Generate JWT
//     const token = await generateJWTWithPrivateKey({ 
//       userId: student._id, 
//       email: student.email,
//       role: ROLES.STUDENT,
//     });
//     res.json({ token });

//   } catch (error) {
//     console.error("Student login error:", error);
//     res.status(500).json({ message: "Server error during student login" });
//   }
// });

// // Professor Login
// router.post("/professor", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     // Fetch professors
//     const professors = await fetchProfessors(); 
//     const professor = professors.find((p) => p.email === email);

//     if (!professor) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const isPasswordValid = await bcrypt.compare(password, professor.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // Generate JWT
//     const token = await generateJWTWithPrivateKey({ 
//       userId: professor._id, 
//       email: professor.email,
//       roles: [ROLES.PROFESSOR],
//     });
//     res.json({ token });

//   } catch (error) {
//     console.error("Professor login error:", error);
//     res.status(500).json({ message: "Server error during professor login" });
//   }
// });

// module.exports = router;

// authService/routes/auth/loginRoute.js
const express = require("express");
const bcrypt = require("bcryptjs"); // Assuming you use bcryptjs in authService
const { generateJWTWithPrivateKey, fetchStudents, fetchProfessors } = require("./util"); // Ensure generateJWTWithPrivateKey is correctly implemented
const { ROLES } = require("../../../consts");
const router = express.Router();

// Student Login (remains the same)
router.post("/student", async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const students = await fetchStudents();
        const student = students.find((s) => s.email === email);
        if (!student || !student.password) { // Check if student and student.password exist
            return res.status(401).json({ message: "Invalid email or password (student not found or no password)" });
        }
        const isPasswordValid = await bcrypt.compare(password, student.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = await generateJWTWithPrivateKey({
            userId: student._id,
            email: student.email,
            roles: [ROLES.STUDENT], // Ensure roles is an array
        });
        res.json({ token, user: { id: student._id, email: student.email, name: student.name, roles: [ROLES.STUDENT] } });
    } catch (error) {
        console.error("Student login error:", error);
        res.status(500).json({ message: "Server error during student login" });
    }
});

// Professor Login (with Admin check)
router.post("/professor", async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const professors = await fetchProfessors(); // This needs to return password hashes
        const professor = professors.find((p) => p.email === email);

        if (!professor || !professor.password) { // Check if professor and professor.password exist
            return res.status(401).json({ message: "Invalid email or password (professor not found or no password hash)" });
        }

        const isPasswordValid = await bcrypt.compare(password, professor.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        let userRoles = [ROLES.PROFESSOR]; // Default to PROFESSOR
        // Assign ADMIN role if the email matches your designated admin email
        if (professor.email === "admin@example.com") {
            userRoles = [ROLES.ADMIN, ROLES.PROFESSOR]; // Admin can also be a professor
        }

        const token = await generateJWTWithPrivateKey({
            userId: professor._id, // This is the ID from the professorService DB
            email: professor.email,
            roles: userRoles, // Use the determined roles (as an array)
        });
        
        // Send back user info along with token
        const userResponse = {
            id: professor._id,
            email: professor.email,
            name: professor.name,
            roles: userRoles
        };

        res.json({ token, user: userResponse });

    } catch (error) {
        console.error("Professor login error:", error);
        // Check if the error is due to fetchProfessors (e.g., professorService down)
        if (error.message && error.message.includes("fetchProfessors")) {
             return res.status(503).json({ message: "Service unavailable: Could not connect to professor service."});
        }
        res.status(500).json({ message: "Server error during professor login" });
    }
});

module.exports = router;
