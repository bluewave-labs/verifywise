import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { runAdvisor } from "../controllers/advisor.ctrl";


router.post("/", authenticateJWT, runAdvisor);


export default router;
