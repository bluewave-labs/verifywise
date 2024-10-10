import express from "express";
const router = express.Router();

import {
  createRequirement,
  deleteRequirementById,
  getAllRequirements,
  getRequirementById,
  updateRequirementById
} from "../controllers/requirement.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllRequirements);
router.get("/:id", authenticateJWT, getRequirementById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createRequirement);
router.put("/:id", authenticateJWT, updateRequirementById);
router.delete("/:id", authenticateJWT, deleteRequirementById);


export default router;