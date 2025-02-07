import express from "express";
import { sendEmail } from "../services/emailService";
import fs from "fs";
import path from "path";
import { generateToken } from "../utils/jwt.util";

const router = express.Router();

router.post("/invite", async (req, res) => {
  const { to, name } = req.body;

  if (!to || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Read the MJML template file
    const templatePath = path.resolve(
      __dirname,
      "../templates/account-creation-email.mjml"
    );
    const template = fs.readFileSync(templatePath, "utf8");

    const token = generateToken({
      name: name,
      email: to
    }) as string

    const link = `${req.protocol}://${req.hostname}:${process.env.FRONTEND_PORT}/user-reg?${new URLSearchParams(
      { token }
    ).toString()}`

    // Data to be replaced in the template
    const data = { name, link };

    // Send the email
    await sendEmail(
      to,
      "Create your account",
      "Please use the link to create your account.",
      template,
      data
    );

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { to, name, email, url } = req.body;

  if (!to || !name || !email || !url) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Read the MJML template file
    const templatePath = path.resolve(
      __dirname,
      "../templates/password-reset-email.mjml"
    );
    const template = fs.readFileSync(templatePath, "utf8");

    // Data to be replaced in the template
    const data = { name, email, url };

    // Send the email
    await sendEmail(
      to,
      "Password reset request",
      "Please use the link to reset your password.",
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
