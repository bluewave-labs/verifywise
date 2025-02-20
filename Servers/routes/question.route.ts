import express from "express";
const router = express.Router();
const multer = require("multer");
const upload = multer({ Storage: multer.memoryStorage() });

import {
  createQuestion,
  deleteQuestionById,
  getAllQuestions,
  getQuestionById,
  getQuestionsBySubtopicId,
  updateQuestionById,
} from "../controllers/question.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", /*authenticateJWT,*/ getAllQuestions);
router.get("/:id", /*authenticateJWT,*/ getQuestionById);
router.get("/bysubtopic/:id", getQuestionsBySubtopicId);

// POST, PUT, DELETE requests
router.post("/", /*authenticateJWT,*/ upload.any("files"), createQuestion);
router.patch(
  "/:id",
  /*authenticateJWT,*/ upload.any("files"),
  updateQuestionById
);
router.delete("/:id", /*authenticateJWT,*/ deleteQuestionById);

export default router;
