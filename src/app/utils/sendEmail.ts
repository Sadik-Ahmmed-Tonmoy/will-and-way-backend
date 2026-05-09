import nodemailer from "nodemailer";
import config from "../../config";

export const sendEmail = async (subject: string, to: string, html: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.nodemailer.email,      // FULL Gmail address
        pass: config.nodemailer.pass,          // App Password, 16 characters
      },
    });

    const info = await transporter.sendMail({
      from: config.nodemailer.email,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
