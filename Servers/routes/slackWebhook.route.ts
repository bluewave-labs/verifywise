import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import {
  createNewSlackWebhook,
  getAllSlackWebhooks,
  getSlackWebhookById,
  updateSlackWebhookById,
  sendSlackMessage,
} from "../controllers/slackWebhook.ctrl";

// GET requests
router.get("/", authenticateJWT, getAllSlackWebhooks);
router.get("/:id", authenticateJWT, getSlackWebhookById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createNewSlackWebhook);
router.patch("/:id", authenticateJWT, updateSlackWebhookById);

// Send slack message
router.post("/:id/send", authenticateJWT, sendSlackMessage);

export default router;
