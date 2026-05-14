import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testMail() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "✅ Gmail Test Mail",
      text: "This is a test email from Nodemailer + Gmail App Password.",
    });

    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Test email failed:", err);
  }
}

testMail();
