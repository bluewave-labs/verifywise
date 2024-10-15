import express from "express";
const router = express.Router();

import {
  createRisk,
  deleteRiskById,
  getAllRisks,
  getRiskById,
  updateRiskById
} from "../controllers/risk.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests

/**
 * fetches all risks from the db
 */
router.get("/", authenticateJWT, getAllRisks);

/**
 * fetches a single risk from the db based on the id
 */
router.get("/:id", authenticateJWT, getRiskById);

// POST, PUT, DELETE requests

/**
 * creates risk in the db
 */
router.post("/", authenticateJWT, createRisk);

/**
 * updates the risk in the db based on the id
 */
router.put("/:id", authenticateJWT, updateRiskById);

/**
 * deletes the risk in the db based on the id
 */
router.delete("/:id", authenticateJWT, deleteRiskById);


export default router;