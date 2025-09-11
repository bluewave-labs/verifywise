import express from "express";
import {
  getDashboardData,
  getExecutiveOverview,
} from "../controllers/dashboard.ctrl";
import authenticateJWT from "../middleware/auth.middleware";
const router = express.Router();

router.get("/", authenticateJWT, getDashboardData);
router.get("/executive", authenticateJWT, getExecutiveOverview);

export default router;
