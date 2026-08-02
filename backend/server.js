// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import cors from "cors";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

//import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import stringSimilarity from "string-similarity";
import { OpenAI } from "openai";
import multer from "multer";
import profileRoutes from "./routes/profileRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";
import skillgapRoutes from "./routes/skillgapRoutes.js";
// import pdfParse from "pdf-parse";
import mammoth from "mammoth";


// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import internshipRoutes from "./routes/internshipRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

console.log("✅ Resume route registered at /api/resume");

// Load environment variables
//dotenv.config();
//console.log("OpenAI Key Loaded:", process.env.OPENAI_API_KEY ? "✅ Yes" : "❌ No");


// ================== EXPRESS APP ==================
const app = express();

// 📝 REQUEST LOGGER: Shows activity in the terminal (Chapter 4.7 Insight)
app.use((req, res, next) => {
  console.log(`\x1b[36m[${new Date().toLocaleTimeString()}]\x1b[0m ${req.method} ${req.url}`);
  next();
});

// ===== CORS CONFIGURATION =====
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ===== BODY PARSER =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== REQUEST LOGGING ==================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ================== STATIC FILES ==================
app.use(express.static(path.join(process.cwd(), "public")));

// Handle legacy resumes without extensions by forcing PDF type if no extension exists
app.use("/uploads", (req, res, next) => {
    const ext = path.extname(req.path);
    if (!ext && req.path !== "/") {
        res.type('pdf');
    }
    next();
}, express.static(path.join(process.cwd(), "uploads")));

// ================== MONGODB CONNECTION ==================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
};
connectDB();

// ================== API ROUTES ==================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/resume", resumeRoutes);
console.log("✅ Employer routes registered at /api/employers");

app.use("/api/institution", institutionRoutes);
app.use("/api/skillgap", skillgapRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/feedback", (await import("./routes/feedbackRoutes.js")).default);


// ================== HEALTH CHECK ==================
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    pid: process.pid,
    env: process.env.NODE_ENV || "development",
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

//skillgap name

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend files
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});
// ================== FALLBACK ROUTE ==================
app.get("*", (req, res) => {
  const filePath = path.join(process.cwd(), "public", req.path);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send("Page not found");
  });
});

// Standardized chatbot routes are now handled by chatbotRoutes.js mounted at /api/chatbot

// ================== DEBUG: LIST ALL ROUTES ==================
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log("DIRECT ROUTE:", r.route.path);
  } else if (r.name === "router") {
    // Attempt to find the mount path (this is non-trivial in Express, so we use a fallback)
    const mountPath = r.regexp.toString().includes('auth') ? '/api/auth' : 
                      r.regexp.toString().includes('employers') ? '/api/employers' : 
                      r.regexp.toString().includes('institution') ? '/api/institution' : '/api/...';
    
    handler_loop: for (const handler of r.handle.stack) {
      if (handler.route) {
        console.log("ROUTE:", mountPath + handler.route.path, handler.route.methods);
      }
    }
  }
});

// ================== START SERVER ==================
const PORT = parseInt(process.env.PORT) || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 \x1b[32mServer running at http://localhost:${PORT}\x1b[0m`);

  // Start Pinggy SSH Tunnel in development mode to bypass Windows Firewall
  if (process.env.NODE_ENV !== "production") {
    global.tunnelUrl = null;
    try {
      const pinggy = spawn("ssh", ["-p", "443", "-R0:localhost:" + PORT, "-o", "StrictHostKeyChecking=no", "a.pinggy.io"]);
      pinggy.stdout.on("data", (data) => {
          const output = data.toString();
          const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.pinggy-free\.link/);
          if (match && !global.tunnelUrl) {
              global.tunnelUrl = match[0];
              console.log(`\n🌍 \x1b[32mPUBLIC TUNNEL ACTIVE (Bypasses Firewall!):\x1b[0m ${global.tunnelUrl}\n`);
          }
      });
      pinggy.stderr.on("data", (data) => {
          const output = data.toString();
          const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.pinggy-free\.link/);
          if (match && !global.tunnelUrl) {
              global.tunnelUrl = match[0];
              console.log(`\n🌍 \x1b[32mPUBLIC TUNNEL ACTIVE (Bypasses Firewall!):\x1b[0m ${global.tunnelUrl}\n`);
          }
      });
      pinggy.on("error", (err) => {
          console.log("Pinggy SSH tunnel failed to start:", err.message);
      });
    } catch (e) {
      console.log("Pinggy SSH tunnel exception ignored:", e.message);
    }
  }

  console.log(`\x1b[34m--------------------------------------------------\x1b[0m`);
  console.log(`🔗 \x1b[1mHome / Index:\x1b[0m http://localhost:${PORT}/index.html`);
  console.log(`🔗 \x1b[1mLogin / Start:\x1b[0m http://localhost:${PORT}/login.html`);
  console.log(`🔗 \x1b[1mStudent Dash:\x1b[0m http://localhost:${PORT}/students.html`);
  console.log(`🔗 \x1b[1mEmployer Dash:\x1b[0m http://localhost:${PORT}/employers.html`);
  console.log(`🔗 \x1b[1mInstitution Dash:\x1b[0m http://localhost:${PORT}/institutions.html`);
  console.log(`\x1b[34m--------------------------------------------------\x1b[0m\n`);
});

// ================== GRACEFUL SHUTDOWN ==================
const gracefulShutdown = async (reason) => {
  try {
    console.log(`\n🛑 Shutting down server... reason=${reason}`);
    if (server)
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    console.log("✅ Express server closed");
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    }
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

/*app.post("/post-internship", async (req, res) => {
  const internship = req.body;
  await db.collection("internships").insertOne(internship);
  res.json({ message: "Internship Posted Successfully!" });
});

app.get("/get-internships", async (req, res) => {
  const internships = await db.collection("internships").find().toArray();
  res.json(internships);
});*/
