import express from "express";
import { getFileContentById, getFileMetaByProjectId, postFileContent } from "../controllers/file.ctrl";
const multer = require("multer");
const upload = multer({ Storage: multer.memoryStorage() });

const router = express.Router();

router.get("/:id", getFileContentById);
router.get("/by-projid/:id", getFileMetaByProjectId);
router.post("/", upload.any("files"), postFileContent);

export default router;
