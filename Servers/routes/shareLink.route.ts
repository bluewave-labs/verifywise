import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import {
  createShareLink,
  getShareLinksForResource,
  getShareLinkByToken,
  getSharedDataByToken,
  updateShareLink,
  deleteShareLink,
} from "../controllers/shareLink.ctrl";

// Public endpoints - no authentication required
router.get("/token/:token", getShareLinkByToken);
router.get("/view/:token", getSharedDataByToken);

// Protected endpoints - require authentication
router.post("/", authenticateJWT, createShareLink);
router.get("/:resourceType/:resourceId", authenticateJWT, getShareLinksForResource);
router.patch("/:id", authenticateJWT, updateShareLink);
router.delete("/:id", authenticateJWT, deleteShareLink);

export default router;
