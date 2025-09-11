import express from "express";
import {
  getDashboardData,
  getExecutiveOverview,
  getComplianceAnalytics,
  getRiskAnalytics,
} from "../controllers/dashboard.ctrl";
import authenticateJWT from "../middleware/auth.middleware";
const router = express.Router();

router.get("/", authenticateJWT, getDashboardData);
router.get("/executive", authenticateJWT, getExecutiveOverview);
router.get("/compliance", authenticateJWT, getComplianceAnalytics);
router.get("/risks", authenticateJWT, getRiskAnalytics);

export default router;
