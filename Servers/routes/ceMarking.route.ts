import express from "express";
const router = express.Router();

import {
  getCEMarking,
  updateCEMarking
} from "../controllers/ceMarking.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET CE Marking data for a project
router.get("/:projectId", authenticateJWT, getCEMarking);

// UPDATE CE Marking data for a project
router.put("/:projectId", authenticateJWT, updateCEMarking);

export default router;