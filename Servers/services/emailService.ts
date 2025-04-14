import nodemailer from "nodemailer";
import { compileMjmlToHtml } from "../tools/mjmlCompiler";

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // Use 587 for STARTTLS
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

// Function to send an email
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  template: string,
  data: Record<string, string>
) => {
  // Compile MJML template to HTML
  const html = compileMjmlToHtml(template, data);

  const mailOptions = {
    from: process.env.EMAIL_ID,
    to, subject, text, html
  };

  // Send mail with defined transport object
  return await transporter.sendMail(mailOptions);
};
