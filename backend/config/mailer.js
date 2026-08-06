// backend/config/mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const GMAIL_USER = process.env.GMAIL_USER || "aiintern20.project@gmail.com";
const GMAIL_PASS = process.env.GMAIL_PASS || "gnwpmjrxrgwmnhwq";

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
 * @param {Object} options - { to, subject, text, html, replyTo }
 */
export const sendMail = async ({ to, subject, text, html, replyTo }) => {
  try {
    const info = await transporter.sendMail({
      from: `"AI-Intern Support" <${GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      replyTo
    });
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email send error:", error.message || error);
    throw error;
  }
};
