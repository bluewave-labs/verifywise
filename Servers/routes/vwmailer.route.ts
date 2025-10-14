import express from "express";
import { sendEmail } from "../services/emailService";
import fs from "fs";
import path from "path";
import { generateToken } from "../utils/jwt.utils";
import { frontEndUrl } from "../config/constants";
import { invite } from "../controllers/vwmailer.ctrl";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";

const router = express.Router();

router.post("/invite", async (req, res) => {
  await invite(req, res, req.body);
});

router.post("/reset-password", async (req, res) => {
  const { to, name, email } = req.body;

  logProcessing({
    description: `starting password reset email for user: ${to}`,
    functionName: "reset-password",
    fileName: "vwmailer.route.ts",
  });

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
    const url = `${frontEndUrl}/set-new-password?${new URLSearchParams(
      { token }
    ).toString()}`

    const data = { name, email, url };

    // Send the email
    const info = await sendEmail(
      to,
      "Password reset request",
      // "Please use the link to reset your password.",
      template,
      data
    );

    console.log("Message sent");

    await logSuccess({
      eventType: "Create",
      description: `Successfully sent password reset email to ${to}`,
      functionName: "reset-password",
      fileName: "vwmailer.route.ts",
    });

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);

    await logFailure({
      eventType: "Create",
      description: `Failed to send password reset email to ${to}`,
      functionName: "reset-password",
      fileName: "vwmailer.route.ts",
      error: error as Error,
    });

    return res.status(500).json({ error: "Failed to send email", details: (error as Error).message });
  }
});

export default router;
