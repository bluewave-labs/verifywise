import express from "express";
const router = express.Router();

import {
  createComplianceList,
  deleteComplianceListById,
  getAllComplianceLists,
  getComplianceListById,
  updateComplianceListById
} from "../controllers/complianceList.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", /*authenticateJWT,*/ getAllComplianceLists);
router.get("/:id", /*authenticateJWT,*/ getComplianceListById);

// POST, PUT, DELETE requests
router.post("/", /*authenticateJWT,*/ createComplianceList);
router.put("/:id", /*authenticateJWT,*/ updateComplianceListById);
router.delete("/:id", /*authenticateJWT,*/ deleteComplianceListById);


export default router;