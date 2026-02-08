import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";
import {
  getLifecycleConfig,
  getLifecyclePhases,
  getLifecyclePhaseById,
  createLifecyclePhase,
  updateLifecyclePhase,
  deleteLifecyclePhase,
  reorderLifecyclePhases,
  getLifecycleItems,
  createLifecycleItem,
  updateLifecycleItem,
  deleteLifecycleItem,
  reorderLifecycleItems,
} from "../controllers/modelLifecycleConfig.ctrl";

// Full config (phases + items) - all authenticated users
router.get("/config", authenticateJWT, getLifecycleConfig);

// Phase CRUD
router.get("/phases", authenticateJWT, getLifecyclePhases);
router.get("/phases/:id", authenticateJWT, getLifecyclePhaseById);
router.post("/phases", authenticateJWT, authorize(["Admin"]), createLifecyclePhase);
router.patch("/phases/:id", authenticateJWT, authorize(["Admin"]), updateLifecyclePhase);
router.delete("/phases/:id", authenticateJWT, authorize(["Admin"]), deleteLifecyclePhase);
router.patch("/phases/reorder", authenticateJWT, authorize(["Admin"]), reorderLifecyclePhases);

// Item CRUD
router.get("/phases/:phaseId/items", authenticateJWT, getLifecycleItems);
router.post("/phases/:phaseId/items", authenticateJWT, authorize(["Admin"]), createLifecycleItem);
router.patch("/items/:id", authenticateJWT, authorize(["Admin"]), updateLifecycleItem);
router.delete("/items/:id", authenticateJWT, authorize(["Admin"]), deleteLifecycleItem);
router.patch("/phases/:phaseId/items/reorder", authenticateJWT, authorize(["Admin"]), reorderLifecycleItems);

export default router;
