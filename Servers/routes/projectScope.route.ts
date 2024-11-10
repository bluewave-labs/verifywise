import express from "express";
const router = express.Router();

import {
  getProjectScopeById,
  getAllProjectScopes,
  createProjectScope,
  updateProjectScopeById,
  deleteProjectScopeById,
} from "../controllers/projectScope.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllProjectScopes);
router.get("/:id", authenticateJWT, getProjectScopeById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createProjectScope);
router.put("/:id", authenticateJWT, updateProjectScopeById);
router.delete("/:id", authenticateJWT, deleteProjectScopeById);

export default router;
