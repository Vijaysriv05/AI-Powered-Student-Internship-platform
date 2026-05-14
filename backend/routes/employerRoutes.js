import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import Employer from "../models/Employer.js";
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

// ✅ Import correct middleware and controllers
import { auth, employerAuth } from "../middleware/authMiddleware.js";
import { createInternship, getAllInternships } from "../controllers/employerController.js";

const router = express.Router();

// ✅ Confirm routes are loaded
console.log("✅ Employer routes loaded. Auth middleware:", typeof employerAuth);

// ===================== LOGIN =====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const employer = await Employer.findOne({ companyEmail: email });

    if (!employer)
      return res.status(404).json({ msg: "Employer not found" });

    const isMatch = await bcrypt.compare(password, employer.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: employer._id, role: "employer" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Return MongoDB ObjectId to frontend
    res.json({
      success: true,
      token,
      employerId: employer._id, // 👈 this is critical
      name: employer.full_name,
      email: employer.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ===================== PROFILE =====================
router.get("/profile", employerAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    // 1. Try finding in Employer collection
    let employer = await Employer.findById(userId).lean();
    
    // 2. Fallback to User collection (where viji26@gmail.com is stored)
    if (!employer) {
        employer = await User.findById(userId).lean();
    }

    if (!employer) return res.status(404).json({ message: "Profile not found" });
    
    // Ensure companyName is populated from name/full_name if missing
    employer.companyName = employer.companyName || employer.full_name || employer.name;
    
    // Increment views if employer exists in Employer collection
    if (employer && employer._id) {
        await Employer.findByIdAndUpdate(employer._id, { $inc: { views: 1 } });
    }
    
    res.json(employer); 
  } catch (err) {
    console.error("Error fetching employer profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", employerAuth, async (req, res) => {
  try {
    const updatedData = req.body;
    const employer = await Employer.findByIdAndUpdate(req.user.id, updatedData, {
      new: true,
      runValidators: true,
    });
    if (!employer) return res.status(404).json({ message: "Profile not found" });
    res.json({ user: employer });
  } catch (err) {
    console.error("Error updating employer profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===================== STATS =====================
router.get("/stats", employerAuth, async (req, res) => {
  try {
    const employerId = req.user.id;
    
    // 1. Get active jobs directly attached to this employer
    const activeJobsCount = await Internship.countDocuments({ employerId, status: { $ne: "closed" } });
    
    // 2. Find all internships belonging to this employer
    const employerInternships = await Internship.find({ employerId }).select("_id");
    const internshipIds = employerInternships.map(job => job._id);
    
    // 3. Count applications specifically tied to those internships
    const totalApps = await Application.countDocuments({ internship: { $in: internshipIds } });
    
    // 4. Fetch the employer profile for Views
    let employer = await Employer.findOne({ userId: employerId });
    if (!employer) {
        employer = await Employer.findById(employerId);
    }
    
    res.json({ 
      totalViews: employer ? (employer.views || 0) : 0, 
      activeJobsCount, 
      totalApps 
    });
  } catch (err) {
    console.error("Error fetching employer stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===================== INTERNSHIPS =====================


// ✅ Create internship
router.post("/internship", employerAuth, createInternship);

// ✅ Fetch all internships posted by this employer
router.get("/employers/internships", employerAuth, getAllInternships);


export default router;



