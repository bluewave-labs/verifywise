import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { generateToken } from "../utils/jwt.utils";
import { frontEndUrl } from "../config/constants";
import { sendEmail } from "../services/emailService";

export const invite = async (req: Request, res: Response, body: {
  to: string;
  name: string;
  roleId: number;
  organizationId: number;
}) => {
  const { to, name, roleId, organizationId } = body;

  if (!to || !name || !roleId || !organizationId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Read the MJML template file
    const templatePath = path.resolve(
      __dirname,
      "../templates/account-creation-email.mjml"
    );
    const template = await fs.readFile(templatePath, "utf8");

    const token = generateToken({
      name,
      roleId,
      email: to,
      organizationId
    }) as string

    const link = `${frontEndUrl}/user-reg?${new URLSearchParams(
      { token }
    ).toString()}`

    // Data to be replaced in the template
    const data = { name, link };

    // Send the email
    const info = await sendEmail(
      to,
      "Create your account",
      // "Please use the link to create your account.",
      template,
      data
    );

    if (info.error) {
      console.error("Error sending email:", info.error);
      return res.status(206).json({
        error: `${info.error.name}: ${info.error.message}`,
        message: link
      });
    } else {
      return res.status(200).json({ message: "Email sent successfully" });
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Failed to send email", details: (error as Error).message });
  }
}
