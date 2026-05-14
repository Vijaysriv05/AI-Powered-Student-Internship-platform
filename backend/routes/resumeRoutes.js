import express from "express";
import multer from "multer";
import fs from "fs";
import mammoth from "mammoth";
import { OpenAI } from "openai";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Initialize Groq client
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

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

    // --- AI Analysis with Groq ---
    const prompt = `
      Extract key skills (comma separated) and a 1-sentence summary from this resume text:
      ---
      ${text.substring(0, 3000)}
      ---
      Return json format strictly as: { "skills": [], "summary": "", "score": 0 }
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    // Delete uploaded file
    await fs.promises.unlink(file.path).catch(() => {});

    res.json({ analysis, text: text.trim() });
  } catch (err) {
    console.error("❌ Resume analysis error:", err);
    res.status(500).json({ message: "Error processing resume" });
  }
});

export default router;
