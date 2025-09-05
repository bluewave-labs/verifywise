import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import { getSubscriptionController, createSubscriptionController, updateSubscriptionController, getSubscriptionByIdController } from "../controllers/subscriptions.ctrl";

router.get("/", authenticateJWT, getSubscriptionController);
router.get("/:id", authenticateJWT, getSubscriptionByIdController);
router.post("/", authenticateJWT, createSubscriptionController);
router.put("/:id", authenticateJWT, updateSubscriptionController);

export default router;