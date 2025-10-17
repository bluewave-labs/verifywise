/**
 * @fileoverview File Manager Routes
 *
 * Defines HTTP routes for file manager operations.
 *
 * Routes:
 * - POST   /file-manager       - Upload file (All roles except Auditor)
 * - GET    /file-manager       - List all files (All authenticated users)
 * - GET    /file-manager/:id   - Download file (All authenticated users)
 *
 * Access Control:
 * - All routes require JWT authentication
 * - Upload restricted to Admin, Reviewer, Editor
 * - List and Download available to all authenticated users
 *
 * @module routes/fileManager
 */

import express from "express";
import { uploadFile, listFiles, downloadFile } from "../controllers/fileManager.ctrl";
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";
import multer from "multer";

const router = express.Router();

// Configure multer for file uploads (max 30MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
  },
});

/**
 * @route   POST /file-manager
 * @desc    Upload a file to file manager
 * @access  Admin, Reviewer, Editor (not Auditor)
 * @body    file (multipart/form-data)
 * @returns {201} File uploaded successfully with metadata
 * @returns {400} Invalid file or validation error
 * @returns {403} Access denied (Auditor role)
 * @returns {500} Server error
 */
router.post(
  "/",
  authenticateJWT,
  authorize(["Admin", "Reviewer", "Editor"]),
  upload.single("file"),
  uploadFile
);

/**
 * @route   GET /file-manager
 * @desc    Get list of all files in organization
 * @access  All authenticated users
 * @query   page - Page number (optional)
 * @query   pageSize - Items per page (optional)
 * @returns {200} List of files with metadata and pagination
 * @returns {500} Server error
 */
router.get("/", authenticateJWT, listFiles);

/**
 * @route   GET /file-manager/:id
 * @desc    Download a file by ID
 * @access  All authenticated users
 * @param   id - File ID
 * @returns {200} File content with download headers
 * @returns {403} Access denied (file from different organization)
 * @returns {404} File not found
 * @returns {500} Server error
 */
router.get("/:id", authenticateJWT, downloadFile);

export default router;
