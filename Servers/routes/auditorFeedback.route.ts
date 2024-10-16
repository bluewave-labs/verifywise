import express from "express";
const router = express.Router();

import {
  createAuditorFeedback,
  deleteAuditorFeedbackById,
  getAllAuditorFeedbacks,
  getAuditorFeedbackById,
  updateAuditorFeedbackById
} from "../controllers/auditorFeedback.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllAuditorFeedbacks);
router.get("/:id", authenticateJWT, getAuditorFeedbackById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createAuditorFeedback);
router.put("/:id", authenticateJWT, updateAuditorFeedbackById);
router.delete("/:id", authenticateJWT, deleteAuditorFeedbackById);


export default router;