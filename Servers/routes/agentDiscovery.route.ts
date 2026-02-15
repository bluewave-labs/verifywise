import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import {
  getAllAgentPrimitives,
  getAgentStats,
  getSyncLogs,
  getSyncStatus,
  getAgentPrimitiveById,
  createAgentPrimitive,
  triggerSync,
  reviewAgentPrimitive,
  linkModelToAgent,
  unlinkModelFromAgent,
  deleteAgentPrimitiveById,
} from "../controllers/agentDiscovery.ctrl";

// Static paths first to avoid :id param collision
router.get("/", authenticateJWT, getAllAgentPrimitives);
router.get("/stats", authenticateJWT, getAgentStats);
router.get("/sync/logs", authenticateJWT, getSyncLogs);
router.get("/sync/status", authenticateJWT, getSyncStatus);

// Parameterized routes
router.get("/:id", authenticateJWT, getAgentPrimitiveById);

// Create + sync trigger
router.post("/", authenticateJWT, createAgentPrimitive);
router.post("/sync", authenticateJWT, triggerSync);

// Review + model linking
router.patch("/:id/review", authenticateJWT, reviewAgentPrimitive);
router.patch("/:id/link-model", authenticateJWT, linkModelToAgent);
router.patch("/:id/unlink-model", authenticateJWT, unlinkModelFromAgent);

// Delete
router.delete("/:id", authenticateJWT, deleteAgentPrimitiveById);

export default router;
