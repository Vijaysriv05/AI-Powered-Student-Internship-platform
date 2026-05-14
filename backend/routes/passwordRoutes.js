import express from "express";
import { resetPassword, forgotPassword } from "../controllers/passwordController.js";

const router = express.Router();

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/password/reset-password/:token", resetPassword);

export default router;
