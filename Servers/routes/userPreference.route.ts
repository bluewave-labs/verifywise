import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import {
  getPreferencesByUser,
  createUserPreferences,
  updateUserPreferences,
} from "../controllers/userPreference.ctrl";

const router = express.Router();

router.get("/:userId", authenticateJWT, getPreferencesByUser);
router.post("/", authenticateJWT, createUserPreferences);
router.patch("/:userId", authenticateJWT, updateUserPreferences);

export default router;
