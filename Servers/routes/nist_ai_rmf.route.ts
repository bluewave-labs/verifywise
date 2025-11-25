import express from "express";
const router = express.Router();
import { validateId } from "../domain.layer/validations/id.valid";
import authenticateJWT from "../middleware/auth.middleware";
import {
  getAllNISTAIRMFfunctions,
  getNISTAIRMFfunctionById,
} from "../controllers/nist_ai_rmf.function.ctrl";
import { getAllNISTAIRMFCategoriesByfunctionId } from "../controllers/nist_ai_rmf.category.ctrl";
import {
  getAllNISTAIRMFSubcategoriesBycategoryIdAndtitle,
  getNISTAIRMFSubcategoryById,
  updateNISTAIRMFSubcategoryById,
  updateNISTAIRMFSubcategoryStatus,
} from "../controllers/nist_ai_rmf.subcategory.ctrl";
import {
  getRisksForNISTSubcategory,
  linkRisksToNISTSubcategory,
  updateNISTSubcategoryRiskLinks,
  removeRiskFromNISTSubcategory,
} from "../controllers/nist_ai_rmf.subcategory_risk.ctrl";
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// CRUD requests for NIST AI RMF functions
router.get("/functions", authenticateJWT, getAllNISTAIRMFfunctions); // getting all NIST AI RMF functions of the organization
router.get(
  "/functions/:id",
  authenticateJWT,
  validateId("id"),
  getNISTAIRMFfunctionById
); // getting a specific NIST AI RMF function by id

// CRUD requests for NIST AI RMF categories
router.get(
  "/categories/:title",
  authenticateJWT,
  getAllNISTAIRMFCategoriesByfunctionId
); // getting all NIST AI RMF categories of the organization by function id

// CRUD requests for NIST AI RMF subcategories
router.get(
  "/subcategories/:categoryId/:title",
  authenticateJWT,
  validateId("categoryId"),
  getAllNISTAIRMFSubcategoriesBycategoryIdAndtitle
); // getting all NIST AI RMF subcategories of the organization by category id and title
router.get(
  "/subcategories/byId/:id",
  authenticateJWT,
  validateId("id"),
  getNISTAIRMFSubcategoryById
); // getting a specific NIST AI RMF subcategory by id
router.patch(
  "/subcategories/:id",
  authenticateJWT,
  validateId("id"),
  upload.any(),
  updateNISTAIRMFSubcategoryById
); // updating a specific NIST AI RMF subcategory by id
router.patch(
  "/subcategories/:id/status",
  authenticateJWT,
  validateId("id"),
  updateNISTAIRMFSubcategoryStatus
); // updating status of a specific NIST AI RMF subcategory by id

// Risk linking endpoints for NIST AI RMF subcategories
router.get(
  "/subcategories/:id/risks",
  authenticateJWT,
  validateId("id"),
  getRisksForNISTSubcategory
); // getting all risks linked to a specific NIST AI RMF subcategory
router.post(
  "/subcategories/:id/risks",
  authenticateJWT,
  validateId("id"),
  linkRisksToNISTSubcategory
); // linking risks to a specific NIST AI RMF subcategory
router.put(
  "/subcategories/:id/risks",
  authenticateJWT,
  validateId("id"),
  updateNISTSubcategoryRiskLinks
); // updating risk links for a NIST AI RMF subcategory
router.delete(
  "/subcategories/:id/risks/:riskId",
  authenticateJWT,
  validateId("id"),
  removeRiskFromNISTSubcategory
); // removing a specific risk from a NIST AI RMF subcategory

export default router;
