import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { requirePlugin } from "../middleware/pluginGuard.middleware";
import {
  createNewModelInventory,
  deleteModelInventoryById,
  getAllModelInventories,
  getModelByFrameworkId,
  getModelByProjectId,
  getModelInventoryById,
  updateModelInventoryById,
} from "../controllers/modelInventory.ctrl";
import {
  getModelLifecycle,
  upsertLifecycleValue,
  addLifecycleFile,
  removeLifecycleFile,
  getModelLifecycleProgress,
} from "../controllers/modelLifecycleValues.ctrl";

// GET
router.get("/", authenticateJWT, getAllModelInventories);
router.get("/:id", authenticateJWT, getModelInventoryById);
router.get("/by-projectId/:projectId", authenticateJWT, getModelByProjectId);
router.get("/by-frameworkId/:frameworkId", authenticateJWT, getModelByFrameworkId);

// POST
router.post("/", authenticateJWT, createNewModelInventory);

// PATCH (Update)
router.patch("/:id", authenticateJWT, updateModelInventoryById);

// DELETE
router.delete("/:id", authenticateJWT, deleteModelInventoryById);

// Lifecycle value endpoints (guarded by plugin installation)
const lifecycleGuard = requirePlugin("model-lifecycle");
router.get("/:id/lifecycle", authenticateJWT, lifecycleGuard, getModelLifecycle);
router.get("/:id/lifecycle/progress", authenticateJWT, lifecycleGuard, getModelLifecycleProgress);
router.put("/:id/lifecycle/items/:itemId", authenticateJWT, lifecycleGuard, upsertLifecycleValue);
router.post("/:id/lifecycle/items/:itemId/files", authenticateJWT, lifecycleGuard, addLifecycleFile);
router.delete("/:id/lifecycle/items/:itemId/files/:fileId", authenticateJWT, lifecycleGuard, removeLifecycleFile);

export default router;
