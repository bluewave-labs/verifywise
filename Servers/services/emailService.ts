import nodemailer from "nodemailer";
import { compileMjmlToHtml } from "../tools/mjmlCompiler";

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.example.com", // Replace with your SMTP server
  port: 587, // Replace with your SMTP port
  secure: false, // true for 465, false for other ports
  auth: {
    user: "your-email@example.com", // Replace with your email
    pass: "your-email-password", // Replace with your email password
  },
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
    from: '"Your Name" <your-email@example.com>', // sender address
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body
  };

  // Send mail with defined transport object
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
