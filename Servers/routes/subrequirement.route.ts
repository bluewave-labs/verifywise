import express from "express";
const router = express.Router();

import {
  createSubrequirement,
  deleteSubrequirementById,
  getAllSubrequirements,
  getSubrequirementById,
  updateSubrequirementById
} from "../controllers/subrequirement.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllSubrequirements);
router.get("/:id", authenticateJWT, getSubrequirementById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createSubrequirement);
router.put("/:id", authenticateJWT, updateSubrequirementById);
router.delete("/:id", authenticateJWT, deleteSubrequirementById);


export default router;