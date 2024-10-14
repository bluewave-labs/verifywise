import express from "express";
const router = express.Router();

import {
  createProject,
  deleteProjectById,
  getAllProjects,
  getProjectById,
  updateProjectById
} from "../controllers/project.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllProjects);
router.get("/:id", authenticateJWT, getProjectById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createProject);
router.put("/:id", authenticateJWT, updateProjectById);
router.delete("/:id", authenticateJWT, deleteProjectById);


export default router;