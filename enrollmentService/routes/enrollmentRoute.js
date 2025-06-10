const express = require("express");
const Enrollment = require("../models/enrollment");
const router = express.Router();
const {
  verifyRole,
  restrictStudentToOwnData,
  fetchStudents,
  fetchCourses,
} = require("./auth/util");
const { ROLES } = require("../../consts");

// Create a new enrollment
router.post(
  "/",
  verifyRole([ROLES.ADMIN, ROLES.STUDENT, ROLES.PROFESSOR]),
  async (req, res) => {
    try {
      const { student, course } = req.body;

      if (!student || !course) {
        return res
          .status(400)
          .json({ message: "Student ID and Course ID are required" });
      }

      // Pass the 'req' object to forward the auth token
      const students = await fetchStudents(req);
      const studentExists = students.some(s => s._id.toString() === student.toString()); 
      if (!studentExists) {
        return res.status(404).json({ message: "Student with the provided ID does not exist" });
      }

      // Pass the 'req' object to forward the auth token
      const courses = await fetchCourses(req);
      const courseExists = courses.some(c => c._id.toString() === course.toString());
      if (!courseExists) {
        return res.status(404).json({ message: "Course with the provided ID does not exist" });
      }

      const enrollment = new Enrollment({ student: student, course: course });
      await enrollment.save();

      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      if (error.code === 11000) {
         return res.status(409).json({ message: "Student is already enrolled in this course." });
      }
      res.status(500).json({
        message: "Server Error: Unable to create enrollment",
        error: error.message,
      });
    }
  }
);

// Get all enrollments (Protected for Admin/Professor)
router.get(
  "/",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
  async (req, res) => {
    try {
      let enrollments = await Enrollment.find().populate('student', 'name email').populate('course', 'name code');
      res.status(200).json(enrollments);
    } catch (error) {
      console.error("Error fetching all enrollments:", error);
      res.status(500).json({
        message: "Server Error: Unable to fetch enrollments",
        error: error.message,
      });
    }
  }
);

// Get a specific enrollment by ID
router.get(
  "/:id",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR, ROLES.STUDENT]), 
  async (req, res) => {
    try {
        const enrollmentId = req.params.id;
        const enrollment = await Enrollment.findById(enrollmentId).populate('student', 'name email').populate('course', 'name code');
        
        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        // Ownership check for students
        if (req.user.roles.includes(ROLES.STUDENT) && enrollment.student._id.toString() !== req.user.userId) {
             return res.status(403).json({ message: "Access forbidden: You can only view your own enrollments." });
        }

        return res.status(200).json(enrollment);
    } catch (error) {
      console.error("Error fetching enrollment by ID:", error);
       if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid enrollment ID format" });
      }
      res.status(500).json({
        message: "Server Error: Unable to fetch enrollment",
        error: error.message
      });
    }
  }
);

// Get enrollments by student ID
router.get(
  "/student/:id", 
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR, ROLES.STUDENT]),
  restrictStudentToOwnData, 
  async (req, res) => {
    try {
      let enrollments = await Enrollment.find({ student: req.params.id })
                                        .populate('course', 'name code description schedule');

      if (!enrollments || enrollments.length === 0) {
        return res
          .status(404)
          .json({ message: "No enrollments found for this student ID" });
      }
      
      res.status(200).json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments for student:", error);
      if (error.kind === 'ObjectId') {
           return res.status(400).json({ message: "Invalid student ID format" });
      }
      res.status(500).json({
        message: "Server Error: Unable to fetch enrollments for student",
        error: error.message
      });
    }
  }
);

// Get enrollments by course ID
router.get(
  "/course/:id",
  verifyRole([ROLES.ADMIN, ROLES.PROFESSOR]),
  async (req, res) => {
    try {
      const courseId = req.params.id;
      let enrollments = await Enrollment.find({ course: courseId })
                                        .populate('student', 'name email');

      if (!enrollments || enrollments.length === 0) {
        return res
          .status(404)
          .json({ message: "No enrollments found for this course ID" });
      }
      
      res.status(200).json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments for course:", error);
       if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: "Invalid course ID format" });
      }
      res.status(500).json({
        message: "Server Error: Unable to fetch enrollments for course",
        error: error.message
      });
    }
  }
);

// Delete an enrollment by ID
router.delete(
  "/:id",
  verifyRole([ROLES.ADMIN, ROLES.STUDENT]),
  async (req, res) => {
    try {
      const enrollmentId = req.params.id;
      const enrollment = await Enrollment.findById(enrollmentId);

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      // Ownership Check for Students:
      if (req.user.roles.includes(ROLES.STUDENT) && enrollment.student.toString() !== req.user.userId) {
         return res.status(403).json({ message: "Access forbidden: You can only delete your own enrollments." });
      }

      await Enrollment.findByIdAndDelete(enrollmentId);

      res
        .status(200)
        .json({ message: "Enrollment deleted successfully", enrollment });
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      if (error.kind === "ObjectId") {
        return res
          .status(400)
          .json({ message: "Invalid enrollment ID format" });
      }
      res.status(500).json({
        message: "Server Error: Unable to delete enrollment",
        error: error.message
      });
    }
  }
);

module.exports = router;