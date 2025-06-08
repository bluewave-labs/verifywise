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
router.get("/training-id/:id", getTrainingRegistarById);
// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createNewTrainingRegistar);
router.patch("/:id", updateTrainingRegistarById);
router.delete("/:id", deleteTrainingRegistarById);

export default router;
