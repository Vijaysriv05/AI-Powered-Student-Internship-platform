import express from "express";

const router = express.Router();

// Test route
router.get("/", (req, res) => {
  res.send("Student route works!");
});

export default router;
