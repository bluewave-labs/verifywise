import express from "express";
const router = express.Router();

import { getAllTiers, getTiersFeatures } from "../controllers/tiers.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

// List all tiers
router.get("/", authenticateJWT, getAllTiers);

// This route fetches features of a particular tier
router.get("/features/:id", authenticateJWT, getTiersFeatures);

export default router;