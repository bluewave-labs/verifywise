import express from "express";
import { validateId } from "../domain.layer/validations/id.valid";
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

import authenticateJWT from "../middleware/auth.middleware";
import {
  getAllTopics,
  getAllTopicsWithRequirements,
  getRequirementById,
  getRequirementByStructIdForProject,
  updateRequirement,
  getRequirementRisks,
  getLaw25Progress,
  getLaw25Assignments,
  getLaw25Overview,
} from "../controllers/law25.ctrl";

// Get all topics structure
router.get("/topics", authenticateJWT, getAllTopics);

// Get all topics with requirements for a project
router.get(
  "/topics/byProjectFrameworkId/:id",
  authenticateJWT,
  validateId("id"),
  getAllTopicsWithRequirements
);

// Get requirement by ID
router.get(
  "/requirements/byId/:id",
  authenticateJWT,
  validateId("id"),
  getRequirementById
);

// Get requirement by struct ID for a project
router.get(
  "/requirements/byStructId/:structId",
  authenticateJWT,
  validateId("structId"),
  getRequirementByStructIdForProject
);

// Get all risks linked to a requirement
router.get(
  "/requirements/:id/risks",
  authenticateJWT,
  validateId("id"),
  getRequirementRisks
);

// Update requirement
router.patch(
  "/requirements/:id",
  authenticateJWT,
  validateId("id"),
  upload.any(),
  updateRequirement
);

// Dashboard calculation endpoints
router.get(
  "/progress/:id",
  authenticateJWT,
  validateId("id"),
  getLaw25Progress
);

router.get(
  "/assignments/:id",
  authenticateJWT,
  validateId("id"),
  getLaw25Assignments
);

// Get complete overview with all topics and requirements
router.get(
  "/overview/:id",
  authenticateJWT,
  validateId("id"),
  getLaw25Overview
);

export default router;
