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

export default router;
