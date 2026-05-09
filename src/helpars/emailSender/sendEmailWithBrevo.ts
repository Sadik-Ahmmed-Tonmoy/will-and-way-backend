import axios from "axios";
import config from "../../config";


const sendEmailWithBrevo = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  console.log(  config.emailSender.email_sender_name,
       config.emailSender.email,);
  const payload = {
    sender: {
      name: config.emailSender.email_sender_name,
      email: config.emailSender.email,
    },
    to: [
      {
        email: to,
      },
    ],
    subject,
    htmlContent: html,
    textContent: text || "This is the plain text version of the email.",
  };
  try {
    const res = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": config.emailSender.brevo_api_key,
        "Content-Type": "application/json",
      },
    });
      console.log("Brevo response:", res.data);
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      console.error("Brevo error:", error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error("Brevo error:", error.message);
    } else {
      console.error("Brevo error:", error);
    }
  }
};

export default sendEmailWithBrevo;
