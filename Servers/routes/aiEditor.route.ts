import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import { editorAICommand } from "../controllers/aiEditor.ctrl";

const router = express.Router();

router.post("/command", authenticateJWT, editorAICommand);

export default router;
