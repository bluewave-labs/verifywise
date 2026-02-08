import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
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

// Lifecycle value endpoints
router.get("/:id/lifecycle", authenticateJWT, getModelLifecycle);
router.get("/:id/lifecycle/progress", authenticateJWT, getModelLifecycleProgress);
router.put("/:id/lifecycle/items/:itemId", authenticateJWT, upsertLifecycleValue);
router.post("/:id/lifecycle/items/:itemId/files", authenticateJWT, addLifecycleFile);
router.delete("/:id/lifecycle/items/:itemId/files/:fileId", authenticateJWT, removeLifecycleFile);

export default router;
