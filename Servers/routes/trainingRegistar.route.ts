import express from "express";
const router = express.Router();

import {
  getAllTrainingRegistar,
  getTrainingRegistarById,
  createNewTrainingRegistar,
  updateTrainingRegistarById,
  deleteTrainingRegistarById,
} from "../controllers/trainingRegistar.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllTrainingRegistar);
router.get("/training-id/:id", authenticateJWT, getTrainingRegistarById);
// POST, PATCH, DELETE requests
router.post("/", authenticateJWT, createNewTrainingRegistar);
router.patch("/:id", authenticateJWT, updateTrainingRegistarById);
router.delete("/:id", authenticateJWT, deleteTrainingRegistarById);

export default router;
