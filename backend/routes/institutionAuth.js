// routes/institutionAuth.js
import express from "express";
import Institution from "../models/Institution.js";
import bcrypt from "bcryptjs"; // if password is hashed
import jwt from "jsonwebtoken";

const router = express.Router();

// ================= Institution Login =================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const institution = await Institution.findOne({ email });
    if (!institution) return res.status(401).json({ message: "Invalid credentials" });

    // If password is hashed
    const isMatch = await bcrypt.compare(password, institution.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Generate JWT with role
    const token = jwt.sign(
      { id: institution._id, role: "institution" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: institution._id,
        name: institution.name || institution.institutionName,
        email: institution.email,
        type: institution.type,
        website: institution.website,
        avatar: institution.avatar,
        description: institution.description,
        role: "institution",
      }
    });

  } catch (err) {
    console.error("Institution login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
