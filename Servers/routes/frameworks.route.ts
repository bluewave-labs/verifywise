import express from "express";
const router = express.Router();

import {
  addFrameworkToProject,
  getAllFrameworks,
  getFrameworkById
} from "../controllers/framework.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { validateId } from "../validations/id.valid";

// GET requests
router.get("/", authenticateJWT, getAllFrameworks);
router.get("/:id", authenticateJWT, validateId("id"), getFrameworkById);

router.post("/toProject", authenticateJWT, validateId("frameworkId"), validateId("projectId"), addFrameworkToProject);

export default router;
