import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import {
  createNewSlackWebhook,
  getAllSlackWebhooks,
  getSlackWebhookById,
  updateSlackWebhookById,
} from "../controllers/slackWebhook.ctrl";

// GET requests
router.get("/", authenticateJWT, getAllSlackWebhooks);
router.get("/:id", authenticateJWT, getSlackWebhookById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createNewSlackWebhook);
router.put("/:id", authenticateJWT, updateSlackWebhookById);

export default router;
