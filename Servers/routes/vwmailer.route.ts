import express from "express";
import { sendEmail } from "../services/emailService";
import fs from "fs";
import path from "path";
import { generateToken } from "../utils/jwt.util";

const router = express.Router();

router.post("/invite", async (req, res) => {
  const { to, name, role } = req.body;

  if (!to || !name || !role) {
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
      name,
      role,
      email: to
    }) as string

    const link = `${req.protocol}://${req.hostname}:${process.env.FRONTEND_PORT}/user-reg?${new URLSearchParams(
      { token }
    ).toString()}`

    // Data to be replaced in the template
    const data = { name, link };

    // Send the email
    const info = await sendEmail(
      to,
      "Create your account",
      "Please use the link to create your account.",
      template,
      data
    );
    console.log("Message sent: %s", info.messageId);
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Failed to send email", details: (error as Error).message });
  }
});

router.post("/reset-password", async (req, res) => {
  const { to, name, email } = req.body;

  if (!to || !name || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Read the MJML template file
    const templatePath = path.resolve(
      __dirname,
      "../templates/password-reset-email.mjml"
    );
    const template = fs.readFileSync(templatePath, "utf8");

    const token = generateToken({
      name,
      email: to
    }) as string

    // Data to be replaced in the template
    const url = `${req.protocol}://${req.hostname}:${process.env.FRONTEND_PORT}/set-new-password?${new URLSearchParams(
      { token }
    ).toString()}`

    const data = { name, email, url };

    // Send the email
    const info = await sendEmail(
      to,
      "Password reset request",
      "Please use the link to reset your password.",
      template,
      data
    );

    console.log("Message sent: %s", info.messageId);
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Failed to send email", details: (error as Error).message });
  }
});

export default router;
