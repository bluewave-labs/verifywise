import express from "express";
const router = express.Router();

import {
  createSection,
  deleteSectionById,
  getAllSections,
  getSectionById,
  updateSectionById
} from "../controllers/section.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllSections);
router.get("/:id", authenticateJWT, getSectionById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createSection);
router.put("/:id", authenticateJWT, updateSectionById);
router.delete("/:id", authenticateJWT, deleteSectionById);


export default router;