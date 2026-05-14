import express from "express";
import multer from "multer";
import fs from "fs";
import stringSimilarity from "string-similarity";
import mammoth from "mammoth"; // for DOCX to text
import { OpenAI } from "openai";
import { franc } from "franc";

const router = express.Router();
const openai = new OpenAI({ 
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});
const upload = multer({ dest: "uploads/" });

// ---------------- Helper: Extract resume text ----------------
async function extractResumeText(file) {
  const ext = file.originalname.split(".").pop().toLowerCase();
  let text = "";

  try {
    if (ext === "docx") {
      if (!fs.existsSync(file.path)) {
        console.error("File not found:", file.path);
        return "";
      }
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    } else {
      text = `[Uploaded resume: ${file.originalname}]`; // fallback
    }
  } catch (err) {
    console.error("Error extracting resume text:", err);
    text = `[Could not extract text from: ${file.originalname}]`;
  } finally {
    // Clean up uploaded file
    await fs.promises.unlink(file.path).catch(err =>
      console.error("Failed to delete file:", err)
    );
  }

  return text.trim();
}

// ---------------- FAQ Helpers ----------------
let faqs = JSON.parse(fs.readFileSync("faqs.json", "utf8"));

function detectLang(message) {
  const langCode = franc(message);
  if (langCode === "hin") return "hi";
  if (langCode === "tam") return "ta";
  if (langCode === "spa") return "es";
  return "en";
}

function findFaqMatch(message) {
  const msg = message.toLowerCase();
  const userLang = detectLang(msg);

  // Direct keyword match
  for (const faqKey in faqs) {
    const { keywords, answers } = faqs[faqKey];
    if (keywords.some(k => msg.includes(k.toLowerCase()))) {
      return {
        answer: answers[userLang] || answers["en"],
        matchedKeyword: keywords.find(k => msg.includes(k.toLowerCase())),
        score: 1.0
      };
    }
  }

  // Fuzzy match
  let best = { answer: null, faqKey: null, score: 0, matchedKeyword: null };
  for (const faqKey in faqs) {
    const { keywords, answers } = faqs[faqKey];
    for (const kw of keywords) {
      const score = stringSimilarity.compareTwoStrings(msg, kw.toLowerCase());
      if (score > best.score) {
        best = {
          answer: answers[userLang] || answers["en"],
          faqKey,
          score,
          matchedKeyword: kw
        };
      }
    }
  }

  const THRESHOLD = 0.45;
  return best.score >= THRESHOLD ? best : null;
}

// ---------------- /chatbotRoutes.js Route ----------------
router.post("/chatbotRoutes.js", upload.single("resume"), async (req, res) => {
  try {
    const { message } = req.body;
    let systemPrompt =
      "You are an AI career assistant for students helping with internships, resume building, and skill gaps.";

    if (req.file) {
      const resumeText = await extractResumeText(req.file);
      systemPrompt += `\nThe student uploaded a resume with the following content:\n${resumeText}`;
      systemPrompt +=
        "\nAnalyze it for ATS scoring, missing skills, and suggest courses with links to learn those skills.";
    }

    const messages = [{ role: "system", content: systemPrompt }];
    if (message) messages.push({ role: "user", content: message });

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Something went wrong on the server." });
  }
});

// ---------------- Chatbot message route ----------------
router.post("/message", async (req, res) => {
  const userMessage = (req.body.message || "").trim();
  if (!userMessage)
    return res.status(400).json({ error: "No message provided" });

  // Check multilingual FAQ
  const faqMatch = findFaqMatch(userMessage);
  if (faqMatch) {
    return res.json({
      reply: faqMatch.answer,
      source: "faq",
      matched: faqMatch.matchedKeyword,
      score: faqMatch.score
    });
  }

  // Fallback to OpenAI
  try {
    const userLang = detectLang(userMessage);
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an AI career advisor. Reply in ${userLang} (English=en, Hindi=hi, Tamil=ta, Spanish=es) using concise and helpful responses about internships, careers, skills, and student concerns.`
        },
        { role: "user", content: userMessage }
      ],
      max_tokens: 500
    });

    const aiReply = completion.choices[0].message.content.trim();
    return res.json({ reply: aiReply, source: "ai" });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.json({
      reply: "Sorry, AI service is unavailable. Please try again later.",
      source: "error"
    });
  }
});

// ---------------- Reload FAQs route ----------------
router.post("/reload-faqs", (req, res) => {
  try {
    faqs = JSON.parse(fs.readFileSync("faqs.json", "utf8"));
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------------- /chat-student Route ----------------
router.post("/chat-student", upload.single("resume"), async (req, res) => {
  try {
    const userMessage = (req.body.message || "").trim();
    let resumeText = "";

    if (req.file) {
      resumeText = await extractResumeText(req.file);
      console.log("Resume uploaded and text extracted:", req.file.originalname);
    }

    if (!userMessage && !resumeText) {
      return res
        .status(400)
        .json({ reply: "Please type a message or upload a resume." });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are an AI career advisor for students. Provide resume feedback, ATS scoring tips, missing skill suggestions, recommended learning resources, and answer internship/career questions concisely and helpfully."
      }
    ];

    if (resumeText)
      messages.push({ role: "system", content: `Student resume content:\n${resumeText}` });
    if (userMessage) messages.push({ role: "user", content: userMessage });

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      max_tokens: 800
    });

    const aiReply = completion.choices[0].message.content.trim();
    res.json({ reply: aiReply });
  } catch (err) {
    console.error("Student chatbot error:", err.message || err);
    const errorMsg = err.message && err.message.includes("insufficient_quota")
      ? "OpenAI Quota Exceeded. Please check your billing/credits."
      : "Something went wrong with the chatbot. Please try again later.";
    res.status(500).json({ reply: errorMsg });
  }
});

// AI insights for employers
const aiInsights = `
AI suggests posting more internships for Data Science roles due to high student interest.
Improve candidate selection by focusing on Cloud & ML certifications.
`;

// ---------------- Employer chatbot route ----------------
router.post("/employer", async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === "")
    return res.status(400).json({ reply: "Please provide a message." });

  try {
    // Use gpt-4o-mini (same as student chatbot) to avoid model-specific quota issues
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant for an employer dashboard. Respond concisely and helpfully about job postings, internships, hiring, and candidate recommendations."
        },
        { role: "system", content: "Current AI insights: " + aiInsights },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const aiReply = completion.choices[0].message.content.trim();
    return res.json({ reply: aiReply });
  } catch (err) {
    console.error("Employer OpenAI error:", err);
    return res
      .status(500)
      .json({ reply: "⚠️ Error: Could not fetch AI response." });
  }
});

// ---------------- Mock Interview route ----------------
router.post("/mock-interview-question", async (req, res) => {
  try {
    const { domain, history, testType, language } = req.body;
    if (!domain) return res.status(400).json({ error: "No domain provided" });

    // History contains past questions so we don't repeat them
    const pastQuestionsText = (history || []).join("\n- ");

    let prompt = "";
    if (testType === "MCQ") {
        prompt = `You are an expert technical interviewer in ${domain}. Generate EXACTLY ONE multiple-choice question (MCQ) for a candidate. 
        Format your response strictly as JSON:
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": "A (or B/C/D)",
          "explanation": "Brief explanation"
        }
        Do NOT repeat: ${pastQuestionsText}`;
    } else if (testType === "Coding") {
        prompt = `You are an expert technical interviewer in ${domain}. Generate EXACTLY ONE coding challenge for a candidate using ${language || 'any language'}.
        Provide:
        1. Problem Statement
        2. Input Format
        3. Output Format
        4. One example test case.
        Do NOT provide the solution. Do NOT repeat: ${pastQuestionsText}`;
    } else {
        prompt = `You are an expert technical interviewer in ${domain}. Generate exactly ONE challenging, core technical interview question. Just the question, no answer.
        Do NOT repeat: ${pastQuestionsText}`;
    }

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.8,
      max_tokens: 400,
      response_format: testType === "MCQ" ? { type: "json_object" } : { type: "text" }
    });

    const candidate = completion.choices[0].message.content.trim();
    if (testType === "MCQ") {
        return res.json(JSON.parse(candidate));
    }
    return res.json({ question: candidate });
  } catch (err) {
    console.error("Mock Interview Route Error:", err);
    return res.status(500).json({ error: "Failed to generate question" });
  }
});

router.post("/mock-interview-evaluate", async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ error: "Missing question or answer" });

    const prompt = `
      You are an expert technical interviewer evaluating a candidate's answer.
      Question: ${question}
      Candidate's Answer: ${answer}

      Evaluate the candidate's answer out of 100 based on technical accuracy, clarity, and completeness.
      Respond strictly in JSON format matching exactly this structure:
      {
        "score": <number between 0 and 100>,
        "feedback": "<A brief, 2-3 sentence encouraging but constructive feedback highlighting what they did well and one area to improve>"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return res.json({ score: parsed.score, feedback: parsed.feedback });
  } catch (err) {
    console.error("Evaluate Route Error:", err);
    return res.status(500).json({ error: "Failed to evaluate answer" });
  }
});

export default router;
