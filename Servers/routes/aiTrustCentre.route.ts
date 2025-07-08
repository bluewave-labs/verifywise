import express from "express";
const router = express.Router();

import {
  createAITrustCentreOverview,
  getAITrustCentreOverview,
  updateAITrustCentreOverview,
} from "../controllers/aiTrustCentre";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/overview", authenticateJWT, getAITrustCentreOverview);

// POST requests
router.post("/overview", authenticateJWT, createAITrustCentreOverview);

// PUT requests
router.put("/overview", authenticateJWT, updateAITrustCentreOverview);

export default router; 