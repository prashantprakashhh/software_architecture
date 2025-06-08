const mongoose = require("mongoose");

//Course Schema
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true, 
  },
  description: {
    type: String,
    required: true,
  },
  schedule: {
    days: [String], 
    time: String, 
  },
  createdBy: {
    type: String,
    required: true,
  },
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
