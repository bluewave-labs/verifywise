import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";

// Controllers
import {
  getAllConnectors,
  getConnectorById,
  createConnector,
  updateConnector,
  deleteConnector,
  testConnector,
  syncConnector,
} from "../controllers/shadowAiConnector.ctrl";

import { getEvents, ingestEvents } from "../controllers/shadowAiEvent.ctrl";

import {
  getAllInventory,
  getInventoryById,
  updateInventory,
} from "../controllers/shadowAiInventory.ctrl";

import {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../controllers/shadowAiPolicy.ctrl";

import {
  getViolations,
  updateViolation,
  getExceptions,
  createException,
  updateException,
} from "../controllers/shadowAiViolation.ctrl";

import {
  getReviews,
  createReview,
  updateReview,
} from "../controllers/shadowAiReview.ctrl";

import {
  getEvidenceExports,
  createEvidenceExport,
} from "../controllers/shadowAiEvidence.ctrl";

import {
  getDashboardSummary,
  getDashboardTrends,
} from "../controllers/shadowAiDashboard.ctrl";

// ==================== Connectors ====================
router.get("/connectors", authenticateJWT, getAllConnectors);
router.get("/connectors/:id", authenticateJWT, getConnectorById);
router.post("/connectors", authenticateJWT, createConnector);
router.patch("/connectors/:id", authenticateJWT, updateConnector);
router.delete("/connectors/:id", authenticateJWT, deleteConnector);
router.post("/connectors/:id/test", authenticateJWT, testConnector);
router.post("/connectors/:id/sync", authenticateJWT, syncConnector);

// ==================== Events ====================
router.get("/events", authenticateJWT, getEvents);
router.post("/events/ingest", authenticateJWT, ingestEvents);

// ==================== Inventory ====================
router.get("/inventory", authenticateJWT, getAllInventory);
router.get("/inventory/:id", authenticateJWT, getInventoryById);
router.patch("/inventory/:id", authenticateJWT, updateInventory);

// ==================== Policies ====================
router.get("/policies", authenticateJWT, getAllPolicies);
router.get("/policies/:id", authenticateJWT, getPolicyById);
router.post("/policies", authenticateJWT, createPolicy);
router.patch("/policies/:id", authenticateJWT, updatePolicy);
router.delete("/policies/:id", authenticateJWT, deletePolicy);

// ==================== Violations ====================
router.get("/violations", authenticateJWT, getViolations);
router.patch("/violations/:id", authenticateJWT, updateViolation);

// ==================== Exceptions ====================
router.get("/exceptions", authenticateJWT, getExceptions);
router.post("/exceptions", authenticateJWT, createException);
router.patch("/exceptions/:id", authenticateJWT, updateException);

// ==================== Reviews ====================
router.get("/reviews", authenticateJWT, getReviews);
router.post("/reviews", authenticateJWT, createReview);
router.patch("/reviews/:id", authenticateJWT, updateReview);

// ==================== Evidence Exports ====================
router.get("/evidence", authenticateJWT, getEvidenceExports);
router.post("/evidence/export", authenticateJWT, createEvidenceExport);

// ==================== Dashboard ====================
router.get("/dashboard/summary", authenticateJWT, getDashboardSummary);
router.get("/dashboard/trends", authenticateJWT, getDashboardTrends);

export default router;
