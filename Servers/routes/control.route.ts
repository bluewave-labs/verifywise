import express from "express";
const router = express.Router();

import {
  getControlById,
  getAllControls,
  createControl,
  updateControlById,
  deleteControlById,
} from "../controllers/control.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { saveControls } from "../controllers/control.ctrl";

// GET requests
router.get("/", /*authenticateJWT,*/ getAllControls);
router.get("/:id", /*authenticateJWT,*/ getControlById);

// POST, PUT, DELETE requests
router.post("/", /*authenticateJWT,*/ createControl);
router.post("/saveControls", /*authenticateJWT,*/ saveControls);
router.put("/:id", /*authenticateJWT,*/ updateControlById);
router.delete("/:id", /*authenticateJWT,*/ deleteControlById);

export default router;
