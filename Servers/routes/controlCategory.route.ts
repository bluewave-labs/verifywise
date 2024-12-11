import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import {
  createControlCategory,
  deleteControlCategoryById,
  getAllControlCategories,
  getControlCategoryById,
  updateControlCategoryById,
} from "../controllers/controlCategory.ctrl";

// GET requests
router.get("/" /*authenticateJWT, */, getAllControlCategories);
router.get("/:id" /*authenticateJWT, */, getControlCategoryById);

// POSTs
router.post("/" /*authenticateJWT, */, createControlCategory);

// PUTs
router.put("/:id" /*authenticateJWT, */, updateControlCategoryById);

// DELETEs
router.delete("/:id" /*authenticateJWT, */, deleteControlCategoryById);

export default router;
