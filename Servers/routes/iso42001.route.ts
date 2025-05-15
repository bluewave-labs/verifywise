import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import { saveAnnexes, saveClauses } from "../controllers/iso42001.ctrl";
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.patch(
  "/saveClauses/:id",
  authenticateJWT,
  upload.any(),
  saveClauses
);

router.patch(
  "/saveAnnexes/:id",
  authenticateJWT,
  upload.any(),
  saveAnnexes
);

export default router;
