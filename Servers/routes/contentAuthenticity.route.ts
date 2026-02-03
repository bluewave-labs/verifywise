/**
 * @fileoverview Content Authenticity Routes
 *
 * Express router for Content Authenticity (watermark) endpoints.
 * All routes except health check require authentication and role-based authorization.
 *
 * Authorization Model:
 * - Embed/Detect: Admin, Editor
 * - View history/stats: Admin, Editor, Reviewer, Auditor
 * - Health check: Public (no auth required)
 *
 * @module routes/contentAuthenticity
 */

import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";
import {
  embedWatermarkController,
  detectWatermarkController,
  getWatermarkJobController,
  getWatermarkJobsController,
  getWatermarkStatsController,
  healthCheckController,
  embedArticle50Controller,
  detectComprehensiveController,
  getConfidenceThresholdsController,
  testRobustnessController,
  testSingleTransformationController,
  createC2PAV2Controller,
  verifyC2PAV2Controller,
  getCertificateInfoController,
  getC2PAStatusController,
} from "../controllers/contentAuthenticity.ctrl";

const router = express.Router();

// Role groups for authorization
const ALL_ROLES = ["Admin", "Editor", "Reviewer", "Auditor"];
const WRITE_ROLES = ["Admin", "Editor"];

/**
 * @route   GET /content-authenticity/health
 * @desc    Check WatermarkService health status
 * @access  Public
 */
router.get("/health", healthCheckController);

/**
 * @route   POST /content-authenticity/embed
 * @desc    Embed an invisible watermark into an image
 * @access  Private - Admin, Editor
 * @body    { image_base64: string, file_name: string, file_type: string, file_size?: number, strength?: number, model_id?: number, project_id?: number }
 */
router.post("/embed", authenticateJWT, authorize(WRITE_ROLES), embedWatermarkController);

/**
 * @route   POST /content-authenticity/detect
 * @desc    Detect watermark in an image
 * @access  Private - Admin, Editor
 * @body    { image_base64: string, file_name: string, file_type: string, file_size?: number }
 */
router.post("/detect", authenticateJWT, authorize(WRITE_ROLES), detectWatermarkController);

/**
 * @route   GET /content-authenticity/jobs
 * @desc    Get watermark jobs history
 * @access  Private - All roles
 * @query   type, status, page, limit
 */
router.get("/jobs", authenticateJWT, authorize(ALL_ROLES), getWatermarkJobsController);

/**
 * @route   GET /content-authenticity/jobs/:jobId
 * @desc    Get a specific watermark job by ID
 * @access  Private - All roles
 */
router.get("/jobs/:jobId", authenticateJWT, authorize(ALL_ROLES), getWatermarkJobController);

/**
 * @route   GET /content-authenticity/stats
 * @desc    Get watermark statistics
 * @access  Private - All roles
 */
router.get("/stats", authenticateJWT, authorize(ALL_ROLES), getWatermarkStatsController);

// ============================================================================
// Article 50 Compliance Routes
// ============================================================================

/**
 * @route   POST /content-authenticity/embed/article50
 * @desc    Embed watermark with full EU AI Act Article 50 compliance (watermark + C2PA)
 * @access  Private - Admin, Editor
 * @body    { image_base64, file_name, file_type, strength?, enable_c2pa?, c2pa_options?, provenance? }
 */
router.post(
  "/embed/article50",
  authenticateJWT,
  authorize(WRITE_ROLES),
  embedArticle50Controller
);

/**
 * @route   POST /content-authenticity/detect/comprehensive
 * @desc    Comprehensive detection with watermark and C2PA verification
 * @access  Private - Admin, Editor
 * @body    { image_base64, file_name, file_type, file_size? }
 */
router.post(
  "/detect/comprehensive",
  authenticateJWT,
  authorize(WRITE_ROLES),
  detectComprehensiveController
);

/**
 * @route   GET /content-authenticity/confidence/thresholds
 * @desc    Get confidence threshold configuration and level descriptions
 * @access  Private - All roles
 */
router.get(
  "/confidence/thresholds",
  authenticateJWT,
  authorize(ALL_ROLES),
  getConfidenceThresholdsController
);

// ============================================================================
// Robustness Testing Routes
// ============================================================================

/**
 * @route   POST /content-authenticity/robustness/test
 * @desc    Test watermark robustness against various transformations
 * @access  Private - Admin, Editor
 * @body    { image_base64: string, quick_test?: boolean }
 */
router.post(
  "/robustness/test",
  authenticateJWT,
  authorize(WRITE_ROLES),
  testRobustnessController
);

/**
 * @route   POST /content-authenticity/robustness/transform
 * @desc    Test watermark survival against a single transformation
 * @access  Private - Admin, Editor
 * @body    { image_base64: string, transformation_type: string, parameters?: object }
 */
router.post(
  "/robustness/transform",
  authenticateJWT,
  authorize(WRITE_ROLES),
  testSingleTransformationController
);

// ============================================================================
// C2PA v2 Routes (Real c2pa-python implementation)
// ============================================================================

/**
 * @route   POST /content-authenticity/c2pa/v2/create
 * @desc    Create real C2PA Content Credentials using c2pa-python
 * @access  Private - Admin, Editor
 * @body    { image_base64, format?, model_name, model_version, provider, prompt_hash?, title? }
 */
router.post(
  "/c2pa/v2/create",
  authenticateJWT,
  authorize(WRITE_ROLES),
  createC2PAV2Controller
);

/**
 * @route   POST /content-authenticity/c2pa/v2/verify
 * @desc    Verify real C2PA Content Credentials
 * @access  Private - Admin, Editor
 * @body    { image_base64, format? }
 */
router.post(
  "/c2pa/v2/verify",
  authenticateJWT,
  authorize(WRITE_ROLES),
  verifyC2PAV2Controller
);

/**
 * @route   GET /content-authenticity/c2pa/certificate
 * @desc    Get C2PA signing certificate information
 * @access  Private - All roles
 */
router.get(
  "/c2pa/certificate",
  authenticateJWT,
  authorize(ALL_ROLES),
  getCertificateInfoController
);

/**
 * @route   GET /content-authenticity/c2pa/status
 * @desc    Get C2PA service status (library availability, certificate status)
 * @access  Private - All roles
 */
router.get(
  "/c2pa/status",
  authenticateJWT,
  authorize(ALL_ROLES),
  getC2PAStatusController
);

export default router;
