import express from "express";
import { sendEmail } from "../services/emailService";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post("/", async (req, res) => {
  const { to, name, link } = req.body;

  if (!to || !name || !link) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Read the MJML template file
    const templatePath = path.join(
      __dirname,
      "../templates/account-creation-email.mjml"
    );
    const template = fs.readFileSync(templatePath, "utf8");

    // Data to be replaced in the template
    const data = { name, link };

    // Send the email
    await sendEmail(
      to,
      "Account Creation",
      "Please use the link to create your account.",
      template,
      data
    );

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
