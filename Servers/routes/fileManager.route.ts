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

import express, { Request, Response, NextFunction } from "express";
import { uploadFile, listFiles, downloadFile } from "../controllers/fileManager.ctrl";
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";
import multer from "multer";
import { STATUS_CODE } from "../utils/statusCode.utils";
import * as path from "path";
import * as fs from "fs";
import { ALLOWED_MIME_TYPES } from "../utils/validations/fileManagerValidation.utils";

const router = express.Router();

// Ensure temp directory exists at startup
const tempDir = path.join(process.cwd(), "uploads", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for file uploads with disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random string + original extension
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const uniqueFilename = `${timestamp}_${randomStr}${ext}`;
    cb(null, uniqueFilename);
  },
});

// File filter to validate file types
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const mimetype = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();

  // Check if MIME type is allowed
  const allowedExts = ALLOWED_MIME_TYPES[mimetype as keyof typeof ALLOWED_MIME_TYPES];

  if (allowedExts && Array.isArray(allowedExts) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("UNSUPPORTED_FILE_TYPE"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
  },
  fileFilter: fileFilter,
});

/**
 * Multer error handling middleware
 * Catches file size limit errors and file type rejection errors
 */
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Clean up temporary file if it exists
  if (req.file?.path) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error("Failed to clean up temporary file:", cleanupError);
    }
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json(
        STATUS_CODE[413]('File size exceeds maximum allowed size of 30MB')
      );
    }
    // Other multer errors
    return res.status(400).json(STATUS_CODE[400](err.message));
  }

  // Handle unsupported file type error
  if (err && err.message === "UNSUPPORTED_FILE_TYPE") {
    return res.status(415).json(
      STATUS_CODE[415]('Unsupported file type. Allowed types: Documents (PDF, DOC, DOCX, XLS, XLSX, CSV, MD), Images (JPEG, PNG, GIF, WEBP, SVG, BMP, TIFF), Videos (MP4, MPEG, MOV, AVI, WMV, WEBM, MKV)')
    );
  }

  // Pass to next error handler if not a recognized error
  next(err);
};

/**
 * @route   POST /file-manager
 * @desc    Upload a file to file manager
 * @access  Admin, Reviewer, Editor (not Auditor)
 * @body    file (multipart/form-data)
 * @returns {201} File uploaded successfully with metadata
 * @returns {400} Invalid file or validation error (including file too large)
 * @returns {403} Access denied (Auditor role)
 * @returns {500} Server error
 */
router.post(
  "/",
  authenticateJWT,
  authorize(["Admin", "Reviewer", "Editor"]),
  upload.single("file"),
  handleMulterError,
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
