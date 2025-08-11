import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import {
  createNewModelInventory,
  deleteModelInventoryById,
  getAllModelInventories,
  getModelInventoryById,
  updateModelInventoryById,
} from "../controllers/modelInventory.ctrl";

// GET
router.get("/", authenticateJWT, getAllModelInventories);
router.get("/:id", authenticateJWT, getModelInventoryById);

// POST
router.post("/", authenticateJWT, createNewModelInventory);

// PATCH (Update)
router.patch("/:id", authenticateJWT, updateModelInventoryById);

// DELETE
router.delete("/:id", authenticateJWT, deleteModelInventoryById);

export default router;
