import express from "express";
const router = express.Router();

import {
  postAutoDriver,
} from "../controllers/autoDriver.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

router.post("/", authenticateJWT, postAutoDriver);

export default router;