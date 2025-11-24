import express from "express";
import multer from "multer";
import path from "path";
const router = express.Router();

import {
  getCommentsByTableRow,
  createComment,
  updateComment,
  deleteComment,
  getFilesByTableRow,
  uploadFile,
  downloadFile,
  deleteFile,
  addReaction,
  removeReaction,
  getTableCounts,
  markAsRead,
} from "../controllers/comments.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in uploads/comments directory
    cb(null, "uploads/comments/");
  },
  filename: (req, file, cb) => {
    // Preserve original filename with timestamp prefix for uniqueness
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and documents
    const allowedExtensions = /\.(jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt|csv)$/i;
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'text/plain',
      'text/csv',
    ];

    const extname = allowedExtensions.test(file.originalname.toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and documents are allowed"));
    }
  },
});

// Comment routes
router.get("/:tableId/counts", authenticateJWT, getTableCounts);
router.get("/:tableId/:rowId", authenticateJWT, getCommentsByTableRow);
router.post("/", authenticateJWT, createComment);
router.post("/mark-read", authenticateJWT, markAsRead);
router.put("/:commentId", authenticateJWT, updateComment);
router.delete("/:commentId", authenticateJWT, deleteComment);

// File routes
router.get("/:tableId/:rowId/files", authenticateJWT, getFilesByTableRow);
router.post("/files", authenticateJWT, upload.single("file"), uploadFile);
router.get("/files/:fileId/download", authenticateJWT, downloadFile);
router.delete("/files/:fileId", authenticateJWT, deleteFile);

// Reaction routes
router.post("/:commentId/reactions", authenticateJWT, addReaction);
router.delete(
  "/:commentId/reactions/:emoji",
  authenticateJWT,
  removeReaction
);

export default router;
