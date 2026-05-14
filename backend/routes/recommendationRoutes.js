import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import Internship from "../models/Internship.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import { rankInternships, calculateMatchScore, calculateSuitability } from "../utils/recommendationEngine.js";
import multer from "multer";
import fs from "fs";
import mammoth from "mammoth";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * POST /api/recommendations/suitability
 * Analyzes a resume against a specific job or finds best matches.
 */
router.post("/suitability", auth, upload.single("resume"), async (req, res) => {
  try {
    const { internshipId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Resume file required" });

    // 1. Parse Resume
    const ext = file.originalname.split(".").pop().toLowerCase();
    let text = "";
    if (ext === "pdf") {
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      const pdfParse = require("pdf-parse");
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    // 2. Extract Skills from Resume Text via AI
    const { OpenAI } = await import("openai");
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const skillPrompt = `Extract technical skills as a comma separated list from this resume:\n${text.substring(0, 2000)}`;
    const skillComp = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: skillPrompt }]
    });
    const resumeSkills = skillComp.choices[0].message.content.split(",").map(s => s.trim());

    // Clean up file
    fs.promises.unlink(file.path).catch(() => {});

    // 3. CASE A: Match against specific internship
    if (internshipId && internshipId !== "null" && internshipId !== "undefined") {
      const internship = await Internship.findById(internshipId);
      if (!internship) return res.status(404).json({ message: "Internship not found" });

      const analysis = await calculateSuitability({ skills: resumeSkills }, internship);
      return res.json({ type: "specific", analysis, internshipTitle: internship.title });
    }

    // 4. CASE B: Find best matches from all postings
    const internships = await Internship.find().populate("employerId", "companyName");
    const ranked = rankInternships({ skills: resumeSkills }, internships).slice(0, 3);

    res.json({ type: "general", matches: ranked, extractedSkills: resumeSkills });

  } catch (err) {
    console.error("Suitability Route Error:", err);
    res.status(500).json({ message: "Server error during analysis" });
  }
});
/**
 * GET /api/recommendations/internships
 * Fetches personalized internship recommendations for the logged-in student.
 */
router.get("/internships", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can get recommendations" });
    }

    // 1. Get student profile with skills and cgpa
    const student = await User.findById(req.user._id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // 2. Fetch all active internships
    const internships = await Internship.find().populate("employerId", "companyName");

    // 3. Rank them using our engine
    const recommendations = rankInternships(student, internships);

    // 4. Enrich top 3 with AI insights
    const topRecommendations = recommendations.slice(0, 6);
    
    // We only call AI for the top 3 to save time/tokens
    const enriched = await Promise.all(topRecommendations.map(async (rec, index) => {
      if (index < 3) {
        const { generateAIInsight } = await import("../utils/recommendationEngine.js");
        rec.aiInsight = await generateAIInsight(student, rec);
      }
      return rec;
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/recommendations/applicants/:internshipId
 * Ranks all applicants for a specific internship based on match score.
 */
router.get("/applicants/:internshipId", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ message: "Only employers can rank applicants" });
    }

    const { internshipId } = req.params;

    // 1. Fetch the internship
    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    // 2. Fetch all applications for this internship
    const applications = await Application.find({ internship: internshipId }).populate("student");

    // 3. Extract applications and rank them, appending student details
    const rankedStudents = applications.map(app => {
      const studentObj = app.student ? app.student.toObject() : {};
      return {
        ...studentObj,
        applicationId: app._id,
        applicationStatus: app.status,
        applicationResume: app.resume || studentObj.resume,
        matchScore: app.student ? calculateMatchScore(app.student, internship) : 0
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.json(rankedStudents);
  } catch (err) {
    console.error("Error ranking applicants:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
