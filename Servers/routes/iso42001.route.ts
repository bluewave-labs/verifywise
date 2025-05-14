import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import { deleteISO42001, deleteManagementSystemClauses, deleteReferenceControls, saveAnnexes, saveClauses } from "../controllers/iso42001.ctrl";
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

router.delete("/clauses/byProjectId/:id", authenticateJWT, deleteManagementSystemClauses);
router.delete("/annexes/byProjectId/:id", authenticateJWT, deleteReferenceControls);
router.delete("/:id", authenticateJWT, deleteISO42001);

export default router;
