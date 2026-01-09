/**
 * @fileoverview Wise Search Route
 *
 * Defines the API endpoint for global search functionality.
 *
 * @module routes/search
 */

import express from "express";
const router = express.Router();

import { search } from "../controllers/search.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

// GET /api/search?q=searchterm&limit=20&offset=0
router.get("/", authenticateJWT, search);

export default router;
