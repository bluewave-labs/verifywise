import express from "express";
import {
  getFileContentById,
  getFileMetaByProjectId,
  getUserFilesMetaData,
  postFileContent,
  attachFileToEntity,
  attachFilesToEntity,
  detachFileFromEntity,
  getEntityFiles,
} from "../controllers/file.ctrl";
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";
const multer = require("multer");
const upload = multer({ Storage: multer.memoryStorage() });

const router = express.Router();

router.get("/", authenticateJWT, getUserFilesMetaData);
router.get("/by-projid/:id", authenticateJWT, getFileMetaByProjectId);

// File entity linking endpoints (framework-agnostic)
router.get("/entity/:framework_type/:entity_type/:entity_id", authenticateJWT, getEntityFiles);
router.post("/attach", authenticateJWT, attachFileToEntity);
router.post("/attach-bulk", authenticateJWT, attachFilesToEntity);
router.delete("/detach", authenticateJWT, detachFileFromEntity);

// File download - Admin only
router.get("/:id", authenticateJWT, authorize(["Admin"]), getFileContentById);
router.post("/", authenticateJWT, upload.any("files"), postFileContent);

export default router;
