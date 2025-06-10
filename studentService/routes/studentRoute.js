const express = require("express");
const Student = require("../models/student");
const { verifyRole, restrictStudentToOwnData } = require("./auth/util");
const { ROLES } = require("../../consts");

const router = express.Router();

// POST a new student
router.post("/", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please fill all fields" });
    }
    try {
        const studentExists = await Student.findOne({ email });
        if (studentExists) {
            return res.status(400).json({ message: "Student already exists" });
        }
        const newStudent = new Student({
            name,
            email,
            password,
        });
        const savedStudent = await newStudent.save();
        const studentResponse = savedStudent.toObject();
        delete studentResponse.password;
        return res.status(201).json(studentResponse);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
});

// GET all students
router.get("/", verifyRole([ROLES.ADMIN, ROLES.PROFESSOR, ROLES.ENROLLMENT_SERVICE, ROLES.AUTH_SERVICE]), async (req, res) => {
    try {
        const students = await Student.find();
        return res.status(200).json(students);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
});

// GET a student by ID
router.get("/:id", verifyRole([ROLES.ADMIN, ROLES.PROFESSOR, ROLES.STUDENT]), restrictStudentToOwnData, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select("-password");
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        return res.status(200).json(student);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid student ID format." });
        }
        return res.status(500).json({ message: "Server error" });
    }
});

// PUT update a student by ID
router.put("/:id", verifyRole([ROLES.ADMIN, ROLES.STUDENT]), restrictStudentToOwnData, async (req, res) => {
    const { name, password } = req.body;
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        if (name) {
            student.name = name;
        }
        if (password) {
            student.password = password;
        }
        const updatedStudent = await student.save();
        const studentResponse = updatedStudent.toObject();
        delete studentResponse.password;
        return res.status(200).json(studentResponse);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
});

// DELETE a student by ID
router.delete("/:id", verifyRole([ROLES.ADMIN, ROLES.STUDENT]), restrictStudentToOwnData, async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        return res.status(200).json({ message: "Student deleted" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;