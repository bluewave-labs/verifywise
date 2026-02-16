import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import {
  getFeatureSettings,
  updateFeatureSettings,
} from "../controllers/featureSettings.ctrl";

router.get("/", authenticateJWT, getFeatureSettings);
router.patch("/", authenticateJWT, updateFeatureSettings);

export default router;
