import nodemailer from "nodemailer";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  connectionTimeout: 20000,
  socketTimeout: 30000,
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

// ❌ no verify on boot

export const sendEmail = async (to, subject, text, html) => {
  try {
    return await transporter.sendMail({
      from: `"Your Name" <${process.env.GOOGLE_USER}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Email send failed:", error);
  }
};