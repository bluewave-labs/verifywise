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
  getComplianceById,
  saveControls,
  getControlsByControlCategoryId,
} from "../controllers/control.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllControls);
router.get("/:id", authenticateJWT, getControlById);
router.get("/all/bycategory/:id", authenticateJWT, getControlsByControlCategoryId);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createControl);
router.post("/compliance/:id", authenticateJWT, getComplianceById);

router.patch(
  "/saveControls/:id",
  authenticateJWT,
  upload.any(),
  saveControls
);
router.put("/:id", authenticateJWT, updateControlById);
// router.put("/updateControls/:id", authenticateJWT, updateControls);

router.delete("/:id", authenticateJWT, deleteControlById);

export default router;
