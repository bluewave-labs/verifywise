import express from "express";
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

import authenticateJWT from "../middleware/auth.middleware";
import { deleteISO42001, deleteManagementSystemClauses, deleteReferenceControls, getAllAnnexes, getAllClauses, getAnnexCategoriesByAnnexId, getAnnexCategoryById, getAnnexesByProjectId, getClausesByProjectId, getSubClauseById, getSubClausesByClauseId, saveAnnexes, saveClauses } from "../controllers/iso42001.ctrl";

router.get("/clauses", authenticateJWT, getAllClauses);
router.get("/annexes", authenticateJWT, getAllAnnexes);

router.get("/clauses/byProjectId/:id", authenticateJWT, getClausesByProjectId);
router.get("/annexes/byProjectId/:id", authenticateJWT, getAnnexesByProjectId);

router.get("/subClauses/byClauseId/:id", authenticateJWT, getSubClausesByClauseId);
router.get("/annexCategories/byAnnexId/:id", authenticateJWT, getAnnexCategoriesByAnnexId);

router.get("/subClause/byId/:id", authenticateJWT, getSubClauseById);
router.get("/annexCategory/byId/:id", authenticateJWT, getAnnexCategoryById);

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
