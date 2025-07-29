import { Request, Response } from "express";
import path from "path";
import fs from "fs/promises";
import { generateToken } from "../utils/jwt.utils";
import { frontEndUrl } from "../config/constants";
import { sendEmail } from "../services/emailService";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import logger, { logStructured } from "../utils/logger/fileLogger";

export const invite = async (
  req: Request,
  res: Response,
  body: {
    to: string;
    name: string;
    surname?: string;
    roleId: number;
    organizationId: number;
  }
) => {
  const { to, name, surname, roleId, organizationId } = body;

  logProcessing({
    description: `starting invite email for user: ${to}`,
    functionName: "invite",
    fileName: "vwmailer.ctrl.ts",
  });
  logger.debug(
    `📧 Sending invitation email to ${to} for user ${name} ${surname || ""}`
  );

  if (!to || !name || !roleId || !organizationId) {
    await logFailure({
      eventType: "Create",
      description: `Missing required fields for invitation email to ${to}`,
      functionName: "invite",
      fileName: "vwmailer.ctrl.ts",
      error: new Error("Missing required fields"),
    });
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
      surname,
      roleId,
      email: to,
      organizationId,
    }) as string;

    const link = `${frontEndUrl}/user-reg?${new URLSearchParams({
      token,
    }).toString()}`;

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
      await logFailure({
        eventType: "Create",
        description: `Failed to send invitation email to ${to}: ${info.error.name}: ${info.error.message}`,
        functionName: "invite",
        fileName: "vwmailer.ctrl.ts",
        error: new Error(`${info.error.name}: ${info.error.message}`),
      });
      return res.status(206).json({
        error: `${info.error.name}: ${info.error.message}`,
        message: link,
      });
    } else {
      await logSuccess({
        eventType: "Create",
        description: `Successfully sent invitation email to ${to} for user ${name}`,
        functionName: "invite",
        fileName: "vwmailer.ctrl.ts",
      });
      return res.status(200).json({ message: "Email sent successfully" });
    }
  } catch (error) {
    console.error("Error sending email:", error);
    await logFailure({
      eventType: "Create",
      description: `Failed to send invitation email to ${to}`,
      functionName: "invite",
      fileName: "vwmailer.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json({
      error: "Failed to send email",
      details: (error as Error).message,
    });
  }
};
