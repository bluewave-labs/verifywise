import express from "express";
const router = express.Router();

import {
  getSubcontrolById,
  getAllSubcontrols,
  createNewSubcontrol,
  updateSubcontrolById,
  deleteSubcontrolById,
} from "../controllers/subcontrol.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllSubcontrols);
router.get("/:id", authenticateJWT, getSubcontrolById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createNewSubcontrol);
router.put("/:id", authenticateJWT, updateSubcontrolById);
router.delete("/:id", authenticateJWT, deleteSubcontrolById);

export default router;
