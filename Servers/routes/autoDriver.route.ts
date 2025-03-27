import express from "express";
const router = express.Router();

import {
  deleteAutoDriver,
  postAutoDriver,
} from "../controllers/autoDriver.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

router.post("/", authenticateJWT, postAutoDriver);
router.delete("/", authenticateJWT, deleteAutoDriver)

export default router;