// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Employer from "../models/Employer.js";

/* ===========================================================
   🔹 Basic JWT Authentication Middleware
   =========================================================== */
export const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);

    req.user = { id: decoded.id, _id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ===========================================================
   🔹 General User Protection
   =========================================================== */
export const protectUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, _id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

/* ===========================================================
   🔹 Shorthand Alias
   =========================================================== */
export const protect = (req, res, next) => {
  auth(req, res, next);
};

/* ===========================================================
   🔹 Token Authentication Helper
   =========================================================== */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, _id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    res.status(403).json({ message: "Token is not valid" });
  }
}

/* ===========================================================
   🔹 Employer Authentication Middleware
   =========================================================== */
export const employerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    //console.log("Employer Auth Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Standardized req.user object
    req.user = { id: decoded.id, _id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    console.error("Employer auth error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

