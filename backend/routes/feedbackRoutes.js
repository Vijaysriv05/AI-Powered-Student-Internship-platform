import express from "express";
import Feedback from "../models/Feedback.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all feedbacks with optional filtering
router.get("/", async (req, res) => {
  try {
    const { role, rating } = req.query;
    let query = {};
    if (role) query.role = role;
    if (rating) query.rating = rating;

    const feedbacks = await Feedback.find(query).sort({ date: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching feedbacks" });
  }
});

// Submit new feedback
router.post("/", async (req, res) => {
  try {
    const { name, email, role, rating, message } = req.body;
    
    if (!name || !email || !role || !rating || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newFeedback = new Feedback({
      name, email, role, rating, message
    });

    await newFeedback.save();
    res.status(201).json({ message: "Feedback submitted successfully", feedback: newFeedback });
  } catch (err) {
    console.error("Feedback Save Error:", err);
    res.status(500).json({ message: "Error saving feedback" });
  }
});

export default router;
