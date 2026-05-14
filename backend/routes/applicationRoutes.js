import express from "express";
import path from "path";
import multer from "multer";
import { applyInternship, getApplications, updateApplicationStatus, deleteApplication } from "../controllers/applicationController.js";
import { auth, protectUser } from "../middleware/authMiddleware.js";
import Application from "../models/Application.js";
import { calculateMatchScore } from "../utils/recommendationEngine.js";

const router = express.Router();

// ✅ Configure storage to preserve file extensions
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

// Apply for internship (only logged-in students)
router.post("/", protectUser, upload.single("resumeFile"), applyInternship);

// Get all applications for the logged-in student
router.get("/", auth, getApplications);

// Update status (employers)
router.put("/:id/status", auth, updateApplicationStatus);

// Delete/Withdraw application (students)
router.delete("/:id", auth, deleteApplication);

/**
 * GET /api/applications/internship/:internshipId
 * Returns all applicants for a given internship, ranked by AI match score.
 * Used by the Employer Dashboard "AI Rank Candidates" button.
 */
router.get("/internship/:internshipId", auth, async (req, res) => {
  try {
    const { internshipId } = req.params;
    console.log(`📋 Fetching applicants for internship: ${internshipId} by user role: ${req.user.role}`);

    // Fetch all applications for this internship, populate student details
    const applications = await Application.find({ internship: internshipId })
      .populate("student", "name full_name email skills cgpa resume avatar")
      .populate("internship", "title skills")
      .sort({ createdAt: -1 });

    console.log(`   Found ${applications.length} application(s).`);

    if (applications.length === 0) {
      return res.json([]);
    }

    // Build ranked list with AI match scores
    const ranked = applications.map(app => {
      const studentObj = app.student ? app.student.toObject() : {};
      const internshipObj = app.internship ? app.internship.toObject() : {};
      const matchScore = calculateMatchScore(studentObj, internshipObj);

      return {
        applicationId: app._id,
        status: app.status,
        resume: app.resume || studentObj.resume || "",
        appliedAt: app.createdAt,
        matchScore,
        // Student fields
        name: studentObj.name || studentObj.full_name || "Unknown",
        full_name: studentObj.name || studentObj.full_name || "Unknown",
        email: studentObj.email || "",
        skills: studentObj.skills || [],
        cgpa: studentObj.cgpa || null,
        avatar: studentObj.avatar || "",
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json(ranked);
  } catch (err) {
    console.error("❌ Error fetching applicants for internship:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
