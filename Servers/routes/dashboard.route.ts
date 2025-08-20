import express from "express";
import { getDashboardData } from "../controllers/dashboard.ctrl";
import authenticateJWT from "../middleware/auth.middleware";
const router = express.Router();

router.get("/", authenticateJWT, getDashboardData);

export default router;
