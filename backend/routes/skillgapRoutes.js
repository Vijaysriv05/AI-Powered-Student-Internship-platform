// skillgapRouter.js
import express from "express";
import multer from "multer";
import fs from "fs";
import mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const router = express.Router();
const upload = multer({ dest: "uploads/", limits: { fileSize: 5 * 1024 * 1024 } });

// ✅ Predefined skills
const predefinedSkills = [
  "JavaScript", "React", "Node.js", "MongoDB", "Python",
  "Machine Learning", "Data Analysis", "HTML", "CSS",
  "Express.js", "Communication", "Problem Solving"
];

// ✅ Default user
const defaultUser = { id: "student", name: "Student" };

// ✅ Internship suggestions
function getInternshipsForUser(missingSkills) {
  return missingSkills.map(skill => ({
    title: `${skill} Intern`,
    company: `${skill} Corp`,
    link: `https://www.google.com/search?q=${encodeURIComponent(skill + " internship")}`
  }));
}

// ✅ Resume text extraction
async function extractResumeText(file) {
  const ext = file.originalname.split(".").pop().toLowerCase();
  let text = "";

  try {
    if (ext === "pdf") {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    } else {
      text = `Uploaded resume: ${file.originalname}`;
    }
  } catch (err) {
    console.error("Error extracting text:", err);
    text = "";
  } finally {
    await fs.promises.unlink(file.path).catch(err => console.error("Failed to delete file:", err));
  }

  return text.trim();
}

// ✅ Skill analysis
function analyzeSkills(resumeText) {
  const foundSkills = predefinedSkills.filter(skill =>
    resumeText.toLowerCase().includes(skill.toLowerCase())
  );
  const missingSkills = predefinedSkills.filter(skill => !foundSkills.includes(skill));
  return { foundSkills, missingSkills };
}

// ✅ POST /api/skillgap/analyzeResume
router.post("/analyzeResume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    const resumeText = await extractResumeText(req.file);
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract text from resume" });
    }

    const skillResult = analyzeSkills(resumeText);
    const learningLinks = skillResult.missingSkills.map(skill => ({
      skill,
      resource: `https://www.google.com/search?q=${encodeURIComponent(skill + " course " + (skillResult.foundSkills.length > 0 ? "intermediate" : "beginner"))}`
    }));

    // Calculate match score based on current skills vs predefined total skills
    const { calculateMatchScore } = await import("../utils/recommendationEngine.js");
    const matchScore = calculateMatchScore(
      { skills: skillResult.foundSkills, cgpa: 8.5 }, // Using mock CGPA for analysis
      { skills: predefinedSkills }
    );

    const recommendations = getInternshipsForUser(skillResult.missingSkills);

    return res.json({
      message: "Resume analyzed successfully",
      user: defaultUser,
      resumeText,
      matchScore,
      ...skillResult,
      learningLinks,
      recommendations,
    });

  } catch (err) {
    console.error("❌ Skill gap analysis failed:", err.message);
    return res.status(500).json({
      error: "Server error during resume analysis. Please try again later.",
      details: err.message,
    });
  }
});

export default router;

