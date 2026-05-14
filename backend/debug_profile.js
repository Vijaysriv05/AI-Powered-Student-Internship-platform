import mongoose from "mongoose";
import User from "./models/user.js";
import dotenv from "dotenv";
dotenv.config();

async function checkUser() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: "viji25@gmail.com" });
  console.log("--- Student Profile in DB ---");
  console.log("Name:", user.name || user.full_name);
  console.log("CGPA:", user.cgpa, typeof user.cgpa);
  console.log("Skills:", user.skills, Array.isArray(user.skills));
  process.exit();
}
checkUser();
