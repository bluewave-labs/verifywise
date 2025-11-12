import express from "express";
const router = express.Router();
import { validateId } from "../domain.layer/validations/id.valid";
import authenticateJWT from "../middleware/auth.middleware";
import { getAllNISTAIRMFfunctions } from "../controllers/nist_ai_rmf.function.ctrl";
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// CRUD requests for NIST AI RMF functions
router.get("/functions", authenticateJWT, getAllNISTAIRMFfunctions); // getting all NIST AI RMF functions of the organization
router.get("/functions/:id", authenticateJWT, validateId("id")); // getting a specific NIST AI RMF function by id
router.post("/functions", authenticateJWT); // creating a new NIST AI RMF function
router.patch("/functions/:id", authenticateJWT, validateId("id")); // updating a specific NIST AI RMF function by id
router.delete("/functions/:id", authenticateJWT, validateId("id")); // deleting a specific NIST AI RMF function by id

// CRUD requests for NIST AI RMF categories
router.get(
  "/categories/:functionId",
  authenticateJWT,
  validateId("functionId")
); // getting all NIST AI RMF categories of the organization by function id
router.post("/categories", authenticateJWT); // creating a new NIST AI RMF category
router.patch("/categories/:id", authenticateJWT, validateId("id")); // updating a specific NIST AI RMF category by id
router.delete("/categories/:id", authenticateJWT, validateId("id")); // deleting a specific NIST AI RMF category by id

// CRUD requests for NIST AI RMF subcategories
router.get(
  "/subcategories/:categoryId",
  authenticateJWT,
  validateId("categoryId")
); // getting all NIST AI RMF subcategories of the organization by category id
router.post("/subcategories", authenticateJWT); // creating a new NIST AI RMF subcategory
router.patch(
  "/subcategories/:id",
  authenticateJWT,
  validateId("id"),
  upload.any()
); // updating a specific NIST AI RMF subcategory by id
router.delete("/subcategories/:id", authenticateJWT, validateId("id")); // deleting a specific NIST AI RMF subcategory by id

export default router;
