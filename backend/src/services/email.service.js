import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, text, html) => {
  try {
    const response = await resend.emails.send({
      from: "Palladium Pay <onboarding@resend.dev>",
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent:", response);
    return response;
  } catch (error) {
    console.error("Email send failed:", error);
    throw error;
  }
};