import express from "express";
import { getIncidentHistory } from "../controllers/incidentChangeHistory.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

const router = express.Router();

router.get("/:incidentId", authenticateJWT, getIncidentHistory);

export default router;
