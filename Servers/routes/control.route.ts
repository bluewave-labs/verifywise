import express from "express";
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

import {
  getControlById,
  getAllControls,
  createControl,
  updateControlById,
  deleteControlById,
  updateControls,
} from "../controllers/control.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { saveControls } from "../controllers/control.ctrl";

// GET requests
router.get("/", /*authenticateJWT,*/ getAllControls);
router.get("/:id", /*authenticateJWT,*/ getControlById);

// POST, PUT, DELETE requests
router.post("/", /*authenticateJWT,*/ createControl);
router.post("/saveControls", /*authenticateJWT,*/ upload.fields([
  { name: "evidenceFiles" },
  { name: "feedbackFiles" }
]), saveControls);
router.put("/:id", /*authenticateJWT,*/ updateControlById);
router.put("/updateControls/:id", /*authenticateJWT,*/ updateControls);
router.delete("/:id", /*authenticateJWT,*/ deleteControlById);

export default router;
