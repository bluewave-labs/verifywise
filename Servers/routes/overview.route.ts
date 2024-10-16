import express from "express";
const router = express.Router();

import {
  createOverview,
  deleteOverviewById,
  getAllOverviews,
  getOverviewById,
  updateOverviewById
} from "../controllers/overview.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllOverviews);
router.get("/:id", authenticateJWT, getOverviewById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createOverview);
router.put("/:id", authenticateJWT, updateOverviewById);
router.delete("/:id", authenticateJWT, deleteOverviewById);


export default router;