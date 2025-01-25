import express from "express";
import { getFileContentById } from "../controllers/file.ctrl";
const router = express.Router();

router.get("/:id", getFileContentById);

export default router;
