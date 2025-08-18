import express from "express";
import { getEvents, getLogs } from "../controllers/logger.ctrl";
import authenticateJWT from "../middleware/auth.middleware";
const router = express.Router();

router.get("/events", authenticateJWT, getEvents);

router.get("/logs", authenticateJWT, getLogs);

export default router;
