const express = require("express");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const {
  generateJWTWithPrivateKey,
  fetchStudents,
  fetchProfessors,
} = require("./util");
const { ROLES } = require("../../../consts");

const router = express.Router();

dotenv.config();

// Student Login
router.post("/student", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});
//get tthe list of all students
const students = await fetchStudents();
const student = students.find((student) => student.email === email);
if (!student) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
const isPasswordValid = await bcrypt.compare(password, student.password);
if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
const token = await generateJWTWithPrivateKey(
    student._id,
    student.email,
    ROLES.STUDENT
  );
  res.json({ token });
  

// Professor Login
router.post("/professor", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
