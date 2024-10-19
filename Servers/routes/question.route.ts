import express from "express";
const router = express.Router();

import {
  createQuestion,
  deleteQuestionById,
  getAllQuestions,
  getQuestionById,
  updateQuestionById
} from "../controllers/question.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllQuestions);
router.get("/:id", authenticateJWT, getQuestionById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createQuestion);
router.put("/:id", authenticateJWT, updateQuestionById);
router.delete("/:id", authenticateJWT, deleteQuestionById);


export default router;