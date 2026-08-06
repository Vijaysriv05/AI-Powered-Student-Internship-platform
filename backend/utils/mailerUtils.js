import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const GMAIL_USER = process.env.GMAIL_USER || "aiintern20.project@gmail.com";
const GMAIL_PASS = process.env.GMAIL_PASS || "gnwpmjrxrgwmnhwq";

// Create transporter using Gmail credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

/**
 * Sends an email to the student when their application status is updated.
 */
export const sendStatusEmail = async (toEmail, studentName, companyName, newStatus, jobTitle) => {
  try {
    if (!toEmail || !toEmail.includes("@")) {
      console.log(`⚠️ Invalid recipient email address: "${toEmail}". Skipping email send.`);
      return;
    }

    const statusMessages = {
      'shortlisted': `🎉 Great news! You have been **shortlisted** by ${companyName} for the ${jobTitle} role. They will contact you shortly for the next steps.`,
      'selected': `🏆 Congratulations! You have been **selected** by ${companyName} for the ${jobTitle} role. Check your dashboard for official next steps!`,
      'waiting list': `⏳ You have been placed on the **waiting list** by ${companyName} for the ${jobTitle} role. We will notify you if a spot opens up.`,
      'rejected': `Thank you for applying. Unfortunately, ${companyName} has decided not to move forward with your application for the ${jobTitle} role at this time. Keep applying!`,
    };

    const messageBody = statusMessages[newStatus] || `Your application status for ${jobTitle} at ${companyName} has been updated to: **${newStatus.toUpperCase()}**.`;

    const mailOptions = {
        from: `"AI Intern Updates" <${GMAIL_USER}>`,
        to: toEmail,
        subject: `Update on your ${companyName} Application`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eef2ff; border-radius: 10px;">
                <h2 style="color: #2563eb;">AI-Intern Application Update</h2>
                <p style="font-size: 16px;">Hello <strong>${studentName}</strong>,</p>
                <p style="font-size: 16px;">${messageBody.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#0f172a;">$1</strong>')}</p>
                <br>
                <p style="font-size: 14px; color: #64748b;">Log in to your student dashboard to track all your applications.</p>
                <p style="font-size: 14px; color: #64748b;">Best regards,<br>The AI-Intern Team</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✉️ Status update email successfully sent to ${toEmail} for status: ${newStatus}`);
  } catch (error) {
    console.error("❌ Error sending status update email:", error.message || error);
  }
};
