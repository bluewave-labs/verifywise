import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import {
  createShareLink,
  getShareLinksForResource,
  getShareLinkByToken,
  updateShareLink,
  deleteShareLink,
} from "../controllers/shareLink.ctrl";

// Public endpoint - no authentication required
router.get("/token/:token", getShareLinkByToken);

// Protected endpoints - require authentication
router.post("/", authenticateJWT, createShareLink);
router.get("/:resourceType/:resourceId", authenticateJWT, getShareLinksForResource);
router.patch("/:id", authenticateJWT, updateShareLink);
router.delete("/:id", authenticateJWT, deleteShareLink);

export default router;
