import mongoose from "mongoose";
import User from "./models/user.js";
import Student from "./models/Student.js";
import dotenv from "dotenv";
dotenv.config();

async function checkResume() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: "viji25@gmail.com" });
  const student = await Student.findOne({ userId: user._id });
  
  console.log("--- Profile Status ---");
  console.log("User Resume Field:", user.resume || "EMPTY");
  console.log("Student Resume Field:", (student && student.resume) || "EMPTY");
  console.log("Avatar in User:", user.avatar || "EMPTY");
  
  process.exit();
}
checkResume();
