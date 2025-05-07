import express from "express";
const router = express.Router();

import {
  getAllFrameworks,
  getFrameworkById
} from "../controllers/framework.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllFrameworks);
router.get("/:id", authenticateJWT, getFrameworkById);

export default router;
