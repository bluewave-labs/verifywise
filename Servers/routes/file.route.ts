import express from "express";
import { getFileContentById, getFileMetaByProjectId, postFileContent } from "../controllers/file.ctrl";
import authenticateJWT from "../middleware/auth.middleware";
const multer = require("multer");
const upload = multer({ Storage: multer.memoryStorage() });

const router = express.Router();

router.get("/by-projid/:id", authenticateJWT, getFileMetaByProjectId);
router.get("/:id", authenticateJWT, getFileContentById);
router.post("/", authenticateJWT, upload.any("files"), postFileContent);

export default router;
