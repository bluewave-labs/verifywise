/**
 * Express router for handling organization-related routes.
 *
 * This router provides endpoints for creating, retrieving, updating, and deleting organizations,
 * as well as managing organization members and projects.
 *
 * @module routes/organization.route
 */

import express from "express";
const router = express.Router();

import {
  createOrganization,
  deleteOrganizationById,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationById,
  getOrganizationsExists,
} from "../controllers/organization.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { checkMultiTenancy } from "../middleware/multiTenancy.middleware";

// GET requests
router.get("/exists", getOrganizationsExists);
router.get("/:id", authenticateJWT, getOrganizationById);

// POST requests
router.post("/", checkMultiTenancy, createOrganization);

// PATCH requests
router.patch("/:id", authenticateJWT, updateOrganizationById);

// DELETE requests
// router.delete("/:id", authenticateJWT, deleteOrganizationById);

export default router;
