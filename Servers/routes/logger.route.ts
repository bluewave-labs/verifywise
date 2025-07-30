import express from "express";
import { getEvents, getLogs } from "../controllers/logger.ctrl";
const router = express.Router();

router.get("/events", getEvents);

router.get("/logs", getLogs);

export default router;
