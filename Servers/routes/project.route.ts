import express from "express";
const router = express.Router();

import {
  createProject,
  deleteProjectById,
  getAllProjects,
  getCompliances,
  getProjectById,
  getProjectRisksCalculations,
  getProjectStatsById,
  getVendorRisksCalculations,
  projectAssessmentProgress,
  projectComplianceProgress,
  // saveControls,
  updateProjectById,
} from "../controllers/project.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", /*authenticateJWT,*/ getAllProjects);
router.get(
  "/calculateProjectRisks/:id",
  /*authenticateJWT,*/ getProjectRisksCalculations
);
router.get(
  "/calculateVendorRisks/:id",
  /*authenticateJWT,*/ getVendorRisksCalculations
);
router.get("/:id", /*authenticateJWT,*/ getProjectById);
router.get("/stats/:id", getProjectStatsById);

router.get("/complainces/:projid", getCompliances);

router.get("/compliance/progress/:id", projectComplianceProgress);
router.get("/assessment/progress/:id", projectAssessmentProgress);

// POSTs
router.post("/", /*authenticateJWT,*/ createProject);
// router.post("/saveControls", /*authenticateJWT,*/ saveControls);

// Patches
router.patch("/:id", /*authenticateJWT,*/ updateProjectById);

// DELETEs
router.delete("/:id", /*authenticateJWT,*/ deleteProjectById);

export default router;
