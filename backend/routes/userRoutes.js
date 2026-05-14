import express from "express";
import User from "../models/user.js";

const router = express.Router();

// Fetch user by email
router.get("/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select("-password");
    if(!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
