import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import {
  // Intake form controllers (admin)
  getAllIntakeForms,
  getIntakeFormById,
  createIntakeForm,
  updateIntakeForm,
  deleteIntakeForm,
  archiveIntakeForm,
  // Submission controllers (admin)
  getPendingSubmissions,
  getFormSubmissions,
  getSubmissionById,
  getSubmissionStats,
  approveSubmission,
  rejectSubmission,
  // Public controllers (unauthenticated)
  getPublicForm,
  submitPublicForm,
  getCaptcha,
} from "../controllers/intakeForm.ctrl";

// ============================================================================
// ADMIN ROUTES (Authenticated)
// ============================================================================

// Intake Forms
router.get("/forms", authenticateJWT, getAllIntakeForms);
router.get("/forms/:id", authenticateJWT, getIntakeFormById);
router.post("/forms", authenticateJWT, createIntakeForm);
router.patch("/forms/:id", authenticateJWT, updateIntakeForm);
router.delete("/forms/:id", authenticateJWT, deleteIntakeForm);
router.post("/forms/:id/archive", authenticateJWT, archiveIntakeForm);

// Submissions
router.get("/submissions", authenticateJWT, getPendingSubmissions);
router.get("/submissions/stats", authenticateJWT, getSubmissionStats);
router.get("/submissions/:id", authenticateJWT, getSubmissionById);
router.get("/forms/:id/submissions", authenticateJWT, getFormSubmissions);
router.post("/submissions/:id/approve", authenticateJWT, approveSubmission);
router.post("/submissions/:id/reject", authenticateJWT, rejectSubmission);

// ============================================================================
// PUBLIC ROUTES (Unauthenticated)
// ============================================================================

// Get CAPTCHA question
router.get("/public/captcha", getCaptcha);

// Get public form
router.get("/public/:tenantSlug/:formSlug", getPublicForm);

// Submit public form
router.post("/public/:tenantSlug/:formSlug", submitPublicForm);

export default router;
