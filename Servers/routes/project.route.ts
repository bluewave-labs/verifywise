import express from "express";
const router = express.Router();

import {
  createProject,
  deleteProjectById,
  getAllProjects,
  getProjectById,
  getProjectRisksCalculations,
  getProjectStatsById,
  getVendorRisksCalculations,
  // saveControls,
  updateProjectById,
} from "../controllers/project.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", /*authenticateJWT,*/ getAllProjects);
router.get("/calculateProjectRisks/:id", /*authenticateJWT,*/ getProjectRisksCalculations)
router.get("/calculateVendorRisks/:id", /*authenticateJWT,*/ getVendorRisksCalculations)
router.get("/:id", /*authenticateJWT,*/ getProjectById);
router.get("/stats/:id", getProjectStatsById);

// POSTs
router.post("/", /*authenticateJWT,*/ createProject);
// router.post("/saveControls", /*authenticateJWT,*/ saveControls);

// PUTs
router.put("/:id", /*authenticateJWT,*/ updateProjectById);

// DELETEs
router.delete("/:id", /*authenticateJWT,*/ deleteProjectById);

export default router;
