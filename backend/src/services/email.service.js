import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

export const sendEmail = async (to, subject, text, html) => {
  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: "Palladium Pay",
        email: process.env.BREVO_EMAIL,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      textContent: text,
      htmlContent: html,
    });

    console.log("Email sent:", response);
    return response;
  } catch (error) {
    console.error("Brevo API Error:", error);
    throw error;
  }
};