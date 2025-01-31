import express from "express";
const router = express.Router();

import {
  deleteAutoDriver,
  postAutoDriver,
} from "../controllers/autoDriver.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

if (process.env.ENVIRONMENT === "development") {
  router.post("/", /*authenticateJWT,*/ postAutoDriver);
  router.delete("/", deleteAutoDriver)
}

export default router;