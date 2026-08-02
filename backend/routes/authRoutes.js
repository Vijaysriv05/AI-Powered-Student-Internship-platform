import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import mongoose from "mongoose";
import multer from "multer";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { googleLogin, forgotPassword, resetPassword, login } from "../controllers/authController.js";
import Student from "../models/Student.js";
import Institution from "../models/Institution.js";
import Employer from "../models/Employer.js";
import User from "../models/user.js"; // ✅ Correct filename casing
import Internship from "../models/Internship.js";
import Application from "../models/Application.js";
import { sendMail } from "../config/mailer.js";
import os from "os";

const router = express.Router();

// ✅ Configure storage to preserve file extensions for profile uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Use .any() to be more resilient to field names from different frontend forms
const profileUpload = upload.any();

/**
 * GET /api/auth/server-info
 * Returns the local IP address of the machine
 */
router.get("/server-info", async (req, res) => {
    try {
        // Wait up to 5 seconds for the Pinggy Tunnel to establish
        let attempts = 0;
        while (!global.tunnelUrl && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        if (global.tunnelUrl) {
            const cleanHost = global.tunnelUrl.replace("https://", "").replace("http://", "");
            return res.json({ ip: cleanHost, port: "80" });
        }
        
        const interfaces = os.networkInterfaces();
        let localIp = 'localhost';
        
        for (const devName in interfaces) {
            const iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    localIp = alias.address;
                    break;
                }
            }
        }
        res.json({ ip: localIp, port: 5000 });
    } catch (err) {
        res.json({ ip: 'localhost', port: 5000 });
    }
});

/**
 * POST /api/auth/support-ticket
 * Sends a support ticket email to aiintern20.project@gmail.com
 */
router.post("/support-ticket", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        await sendMail({
            to: "aiintern20.project@gmail.com",
            subject: `[SUPPORT TICKET] ${subject || 'New Inquiry'} from ${name}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #efefef; border-radius: 10px;">
                    <h2 style="color: #2563eb;">New Support Ticket</h2>
                    <p><strong>From:</strong> ${name} (${email})</p>
                    <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            `,
            // Note: sendMail in mailer.js uses GMAIL_USER as 'from'. 
            // We set replyTo to the user's email for easy communication.
            replyTo: email 
        });

        res.json({ message: "Ticket sent successfully! We will get back to you soon." });
    } catch (err) {
        console.error("Support Ticket Error:", err);
        res.status(500).json({ message: "Failed to send support ticket. Please try again later." });
    }
});

/* =====================================================
   REGISTER (Creates User + Role-Specific Record)
   ===================================================== */

router.get("/platform-stats", async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: "student" });
        const employerCount = await User.countDocuments({ role: "employer" });
        const institutionCount = await User.countDocuments({ role: "institution" });
        
        const internshipsPosted = await Internship.countDocuments({});
        const candidatesActive = await Application.countDocuments({ status: "selected" });
        const candidatesInProgress = await Application.countDocuments({ status: { $in: ["pending", "waiting list", "shortlisted"] } });

        res.json({ 
            success: true, 
            students: studentCount, 
            employers: employerCount, 
            institutions: institutionCount,
            internshipsPosted,
            candidatesActive,
            candidatesInProgress
        });
    } catch (err) {
        console.error("Error fetching platform stats:", err);
        res.status(500).json({ success: false });
    }
});

router.post("/register", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ DB not connected during registration. readyState:", mongoose.connection.readyState);
      return res.status(503).json({ message: "Database is not connected. Please check MONGO_URI and MongoDB Atlas IP Whitelist (0.0.0.0/0)." });
    }

    const { name, email, password, role, studentStatus, university, department } = req.body || {};

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Please fill in all required fields (email, password, role)." });
    }

    // 🔹 Normalize Inputs
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedRole = String(role).toLowerCase().trim();

    // 🔹 Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ message: "User already exists with this email" });

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Create base user
    const newUser = await User.create({
      name: name || "User",
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      studentStatus: studentStatus || "None",
      university: university || "",
      department: department || "",
      institutionName: normalizedRole === "institution" ? (name || "") : "",
    });

    // 🔹 Create role-specific entry
    if (normalizedRole === "employer") {
      await Employer.create({
        userId: newUser._id,
        companyName: name || "",
        companyEmail: req.body.companyEmail || normalizedEmail,
      });
    } else if (normalizedRole === "institution") {
      await Institution.create({
        userId: newUser._id,
        institutionName: name || "",
        contactEmail: normalizedEmail,
      });
    } else if (normalizedRole === "student") {
      await Student.create({
        userId: newUser._id,
        university: university || "",
        department: department || "",
        studentStatus: studentStatus || "None",
        contactEmail: normalizedEmail,
      });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    console.log(`✅ User registered successfully: ${normalizedEmail} (${normalizedRole})`);
    res.status(201).json({
      message: `${normalizedRole} registered successfully`,
      user: newUser,
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: `Server error during registration: ${err.message}` });
  }
});

/* =====================================================
   LOGIN (Role-based)
   ===================================================== */
router.post("/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ DB not connected during login. readyState:", mongoose.connection.readyState);
      return res.status(503).json({ message: "Database is not connected. Please check MONGO_URI and MongoDB Atlas IP Whitelist (0.0.0.0/0)." });
    }
    const { email, password, role } = req.body || {};
    
    if (!email || !password || !role) {
      return res.status(400).json({ message: "Please provide email, password, and role." });
    }
    
    // Normalize inputs
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedRole = String(role).toLowerCase().trim();

    console.log(`📡 Login attempt: ${normalizedEmail} as ${normalizedRole}`);

    // ✅ Match user first to give better error feedback
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`❌ Login Fail: User ${normalizedEmail} not found`);
      return res.status(404).json({ message: "User account not found. Please register first." });
    }

    if (user.role !== normalizedRole) {
      console.log(`❌ Role Mismatch: User ${normalizedEmail} is ${user.role}, tried logging in as ${normalizedRole}`);
      return res.status(403).json({ message: `Role mismatch. This account is registered as a ${user.role}.` });
    }

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`❌ Credential Error: Wrong password for ${normalizedEmail}`);
      return res.status(400).json({ message: "Invalid password. Please try again." });
    }

    // ✅ Generate JWT
    const secret = process.env.JWT_SECRET || "mySuperSecretKey123";
    const token = jwt.sign(
      { id: user._id, role: user.role },
      secret,
      { expiresIn: "7d" }
    );

    console.log(`✅ Login Success: ${normalizedEmail}`);
    res.status(200).json({ message: "Login successful", token, user });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: `Server error during login: ${err.message || 'Database connection error'}` });
  }
});

/* =====================================================
   GOOGLE LOGIN (Controller)
   ===================================================== */
router.post("/google", googleLogin);

/* =====================================================
   FORGOT + RESET PASSWORD
   ===================================================== */
router.post("/forgot-password", forgotPassword);
router.post("/password/reset-password/:token", resetPassword);

// ===================== NOTIFICATIONS: READ/DELETE =====================
router.put("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notification = user.notifications.id(req.params.id);
    if (notification) {
      notification.read = true;
      await user.save();
      return res.json({ message: "Notification marked as read" });
    }
    res.status(404).json({ message: "Notification not found" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/notifications/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.notifications.pull({ _id: req.params.id });
    await user.save();
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   GET PROFILE (Authenticated)
   ===================================================== */
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // ✅ Fetch role-specific profile
    let roleProfile = null;
    if (user.role === "student") roleProfile = await Student.findOne({ userId: user._id });
    if (user.role === "institution") roleProfile = await Institution.findOne({ userId: user._id });
    if (user.role === "employer") roleProfile = await Employer.findOne({ userId: user._id });

    res.json({ user: { ...user.toObject(), profile: roleProfile } });
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
});

/* =====================================================
   UPDATE GAMIFICATION (Mock Interview)
   ===================================================== */
router.post("/profile/gamification/mock-interview", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { score } = req.body;
    if (typeof score !== 'number') return res.status(400).json({ message: "Invalid score" });

    // Give points equal to score percentage
    user.gamification.points += Math.round(score);
    
    if (score >= 90 && !user.gamification.badges.includes("Interview Master")) {
      user.gamification.badges.push("Interview Master");
    } 
    if (score >= 75 && score < 90 && !user.gamification.badges.includes("Interview Pro")) {
      user.gamification.badges.push("Interview Pro");
    }

    // Level up every 100 points
    user.level = Math.floor(user.gamification.points / 100) + 1;
    
    await user.save();
    res.json({ message: "Gamification updated", gamification: user.gamification, level: user.level });
  } catch (err) {
    console.error("Gamification Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", authenticateToken, profileUpload, async (req, res) => {
  try {
    console.log("Profile Update - User ID:", req.user.id);
    console.log("Files Array:", req.files ? req.files.map(f => f.fieldname) : "NONE");
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates = req.body;

    // ✅ 1. Apply text updates FIRST
    // Clean updates to avoid overwriting files with empty strings from JSON forms
    if (updates.avatar === "") delete updates.avatar;
    if (updates.resume === "") delete updates.resume;
    
    Object.assign(user, updates);

    // ✅ 2. Handle File Uploads SECOND (Files always win over text fields)
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        if (file.fieldname === 'avatar') {
          user.avatar = file.filename;
          console.log("✅ Avatar saved:", file.filename);
        }
        if (file.fieldname === 'resume') {
          user.resume = file.filename;
          console.log("✅ Resume saved:", file.filename);
        }
        if (file.fieldname === 'certificates') {
          user.courses = [...(user.courses || []), file.filename];
          console.log("✅ Certificate added:", file.filename);
        }
      });
    }

    await user.save();

    // ✅ Keep role-specific Student model synchronized
    if (user.role === "student") {
        try {
            const studentUpdate = { ...updates };
            
            // Sync files
            if (user.resume) studentUpdate.resume = user.resume; 
            if (user.avatar) studentUpdate.avatar = user.avatar;
            
            // Sync CGPA (Protect against NaN)
            if (updates.cgpa !== undefined && updates.cgpa !== "") {
                const parsed = parseFloat(updates.cgpa);
                studentUpdate.cgpa = isNaN(parsed) ? 0 : parsed;
            }

            // Sync Skills
            if (updates.skills !== undefined && updates.skills !== "") {
                studentUpdate.skills = Array.isArray(updates.skills) ? updates.skills : updates.skills.split(',').map(s=>s.trim()).filter(s=>s!=="");
            }
            
            await Student.findOneAndUpdate({ userId: user._id }, studentUpdate, { new: true, upsert: true });
            console.log("✅ Student record synced successfully");
        } catch (syncErr) {
            console.error("❌ Student Record Sync Error:", syncErr);
            // We don't fail the whole request if only the student record sync fails, 
            // but we log it for debugging.
        }
    }

    res.json({ 
        message: "Profile updated successfully", 
        user, 
        debug: {
            filesReceived: req.files ? req.files.map(f => f.fieldname) : [],
            bodyKeys: Object.keys(updates)
        }
    });
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ message: "Server error during profile update" });
  }
});

/* =====================================================
   GAMIFICATION - ADD POINTS
   ===================================================== */
router.put("/gamification/add", authenticateToken, async (req, res) => {
  try {
    const { points, source } = req.body;
    if (!points) return res.status(400).json({ message: "Points are required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure gamification object exists
    if (!user.gamification) {
      user.gamification = { points: 0, badges: [], testsTaken: 0 };
    }

    user.gamification.points = (user.gamification.points || 0) + points;
    user.gamification.testsTaken = (user.gamification.testsTaken || 0) + 1;

    // Calculate level (100 pts per level)
    user.level = Math.floor(user.gamification.points / 100) + 1;

    // Award badges based on activity
    if (source === "Mock Interview" && !user.gamification.badges.includes("AI Interviewer")) {
      user.gamification.badges.push("AI Interviewer");
    }

    // Achievement badges
    if (user.gamification.points >= 500 && !user.gamification.badges.includes("Platinum Student")) {
      user.gamification.badges.push("Platinum Student");
    } else if (user.gamification.points >= 200 && !user.gamification.badges.includes("Gold Performer")) {
      user.gamification.badges.push("Gold Performer");
    }

    await user.save();

    res.json({ message: "Points added successfully", gamification: user.gamification, level: user.level });
  } catch (err) {
    console.error("Gamification Error:", err);
    res.status(500).json({ message: "Server error handling gamification" });
  }
});

export default router;
