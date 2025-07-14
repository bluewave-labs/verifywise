import express from "express";
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
import { validateVisibility } from "../middleware/validateAITrustCentreVisibility.middleware";

import {
  createAITrustResource,
  createAITrustSubprocessor,
  deleteAITrustResource,
  deleteAITrustSubprocessor,
  getAITrustCentreOverview,
  getAITrustCentrePublicPage,
  getAITrustCentreResources,
  getAITrustCentreSubprocessors,
  updateAITrustOverview,
  updateAITrustResource,
  updateAITrustSubprocessor,
} from "../controllers/aiTrustCentre.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { validateId } from "../domain.layer/validations/id.valid";

router.get("/overview", authenticateJWT, getAITrustCentreOverview);
router.get("/resources", authenticateJWT, getAITrustCentreResources);
router.get("/subprocessors", authenticateJWT, getAITrustCentreSubprocessors);
router.get("/:hash", validateVisibility, getAITrustCentrePublicPage);

router.post("/resources", authenticateJWT, upload.any(), createAITrustResource);
router.post("/subprocessors", authenticateJWT, createAITrustSubprocessor);

// router.put("/", authenticateJWT, updateAITrustCentre);
router.put("/overview", authenticateJWT, updateAITrustOverview);
router.put("/resources/:id", authenticateJWT, validateId("id"), upload.any(), updateAITrustResource);
router.put("/subprocessors/:id", authenticateJWT, validateId("id"), updateAITrustSubprocessor);

router.delete("/resources/:id", authenticateJWT, validateId("id"), deleteAITrustResource);
router.delete("/subprocessors/:id", authenticateJWT, validateId("id"), deleteAITrustSubprocessor);

export default router; 