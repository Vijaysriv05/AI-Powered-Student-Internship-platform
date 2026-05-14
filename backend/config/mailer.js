// backend/config/mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const { GMAIL_USER, GMAIL_PASS } = process.env;

if (!GMAIL_USER || !GMAIL_PASS) {
  console.error("❌ Missing GMAIL_USER or GMAIL_PASS in .env");
  process.exit(1);
}

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  }
});

/**
 * sendMail - sends an email using Gmail transporter
 * @param {Object} options - { to, subject, text, html }
 */
export const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: GMAIL_USER,
      to,
      subject,
      text,
      html
    });
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw error;
  }
};
