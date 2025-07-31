import { Resend } from "resend";
import { compileMjmlToHtml } from "../tools/mjmlCompiler";

const resend = new Resend(process.env.RESEND_API_KEY || "Abd");

// Function to send an email
export const sendEmail = async (
  to: string,
  subject: string,
  template: string,
  data: Record<string, string>
) => {
  // Compile MJML template to HTML
  const html = compileMjmlToHtml(template, data);

  if (!process.env.EMAIL_ID) {
    throw new Error("Email ID is not set in environment variables");
  }

  const mailOptions = {
    from: process.env.EMAIL_ID,
    to, subject, html
  };

  // Send mail with defined transport object
  return await resend.emails.send(mailOptions);
};
