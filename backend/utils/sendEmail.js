import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Create transporter (using Gmail as example)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,  // your Gmail address
        pass: process.env.EMAIL_PASS,  // your App Password (not Gmail password!)
      },
    });

    // Mail options
    const mailOptions = {
      from: `"Internship Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // Send mail
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to:", to);
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
