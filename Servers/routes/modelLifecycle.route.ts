import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";
import { requirePlugin } from "../middleware/pluginGuard.middleware";
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

// Authenticate first so req.tenantId is available for the plugin guard
router.use(authenticateJWT);
// Guard all lifecycle config routes by plugin installation
router.use(requirePlugin("model-lifecycle"));

// Full config (phases + items) - all authenticated users
router.get("/config", getLifecycleConfig);

// Phase CRUD — reorder must come before :id to avoid Express matching "reorder" as :id
router.get("/phases", getLifecyclePhases);
router.patch("/phases/reorder", authorize(["Admin"]), reorderLifecyclePhases);
router.get("/phases/:id", getLifecyclePhaseById);
router.post("/phases", authorize(["Admin"]), createLifecyclePhase);
router.patch("/phases/:id", authorize(["Admin"]), updateLifecyclePhase);
router.delete("/phases/:id", authorize(["Admin"]), deleteLifecyclePhase);

// Item CRUD
router.get("/phases/:phaseId/items", getLifecycleItems);
router.post("/phases/:phaseId/items", authorize(["Admin"]), createLifecycleItem);
router.patch("/items/:id", authorize(["Admin"]), updateLifecycleItem);
router.delete("/items/:id", authorize(["Admin"]), deleteLifecycleItem);
router.patch("/phases/:phaseId/items/reorder", authorize(["Admin"]), reorderLifecycleItems);

export default router;
