import express from "express";
const router = express.Router();
import { validateId } from "../domain.layer/validations/id.valid";
import authenticateJWT from "../middleware/auth.middleware";
import {
  getAllNISTAIRMFfunctions,
  getNISTAIRMFfunctionById,
} from "../controllers/nist_ai_rmf.function.ctrl";
import { getAllNISTAIRMFCategoriesByfunctionId } from "../controllers/nist_ai_rmf.category.ctrl";
import { getAllNISTAIRMFSubcategoriesBycategoryId } from "../controllers/nist_ai_rmf.subcategory.ctrl";
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
  "/subcategories/:categoryId",
  authenticateJWT,
  validateId("categoryId"),
  getAllNISTAIRMFSubcategoriesBycategoryId
); // getting all NIST AI RMF subcategories of the organization by category id
router.patch(
  "/subcategories/:id",
  authenticateJWT,
  validateId("id"),
  upload.any()
); // updating a specific NIST AI RMF subcategory by id

export default router;
