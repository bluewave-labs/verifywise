import express from "express";
const router = express.Router();

import {
  createVendorRisk,
  deleteVendorRiskById,
  getAllVendorRisks,
  getVendorRiskById,
  updateVendorRiskById
} from "../controllers/vendorRisk.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllVendorRisks);
router.get("/:id", authenticateJWT, getVendorRiskById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createVendorRisk);
router.put("/:id", authenticateJWT, updateVendorRiskById);
router.delete("/:id", authenticateJWT, deleteVendorRiskById);


export default router;