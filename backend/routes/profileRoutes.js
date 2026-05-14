import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

// Middleware to check token
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
}

// 🔹 Login endpoint (bcrypt)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Compare hashed password
    const bcrypt = await import("bcryptjs");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT including role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 Get profile endpoint
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Common fields
    const profile = {
      id: user._id,
      full_name: user.full_name,
      name: user.name,
      role: user.role,
      email: user.email,
      avatar: user.avatar,
      university: user.university,
      resume: user.resume,
      courses: user.courses,
      certificates: user.certificates,
      gamification: user.gamification,
      skills: user.skills || [],
      cgpa: user.cgpa || 0,
      profile_data: user.profile_data || {},
    };

    // Role-specific fields
    if (user.role === "employer") {
      profile.companyName = user.companyName;
      profile.industry = user.industry;
      profile.website = user.website;
      profile.employees = user.employees;
      profile.description = user.description;
    }

    if (user.role === "institution") {
      profile.institutionName = user.institutionName;
      profile.type = user.type;
      profile.website = user.website;
      profile.studentsCount = user.studentsCount;
      profile.description = user.description;
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔹 Update profile endpoint
router.put("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Common fields
    const { name, email, avatar, resume, university, certificates, skills, cgpa } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (resume) user.resume = resume;
    if (university) user.university = university;
    if (certificates) user.certificates = certificates;
    if (skills) user.skills = skills;
    if (cgpa !== undefined) user.cgpa = cgpa;

    // Employer fields
    if (user.role === "employer") {
      const { companyName, companyEmail, industry, website, employees, description } = req.body;
      if (companyName) user.companyName = companyName;
      if (companyEmail) user.email = companyEmail; // override email
      if (industry) user.industry = industry;
      if (website) user.website = website;
      if (employees) user.employees = employees;
      if (description) user.description = description;
    }

    // Institution fields
    if (user.role === "institution") {
      const { institutionName, institutionEmail, type, website, studentsCount, description } = req.body;
      if (institutionName) user.institutionName = institutionName;
      if (institutionEmail) user.email = institutionEmail; // override email
      if (type) user.type = type;
      if (website) user.website = website;
      if (studentsCount) user.studentsCount = studentsCount;
      if (description) user.description = description;
    } // Added missing closing brace

    // 🎮 Gamification: Award points for milestones
    let pointsEarned = 0;
    if (resume && !user.resume) pointsEarned += 50; // 50 pts for first resume upload
    if (skills && (skills.length > (user.skills?.length || 0))) pointsEarned += 5; // 5 pts for new skill

    if (pointsEarned > 0) {
      if (!user.gamification) user.gamification = { points: 0, badges: [], streak: 0 };
      user.gamification.points += pointsEarned;
      console.log(`[Gamification] +${pointsEarned} pts awarded to ${user.name}`);
    }

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
