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
// router.get("/", authenticateJWT, getAllOrganizations);
router.get("/exists", getOrganizationsExists);
router.get("/:id", authenticateJWT, getOrganizationById);
// router.get("/:id/members", authenticateJWT, getOrganizationMembers);
// router.get("/:id/projects", authenticateJWT, getOrganizationProjects);

// POST requests
router.post("/", checkMultiTenancy, createOrganization);
// router.post("/:id/members", authenticateJWT, addMemberToOrganization);
// router.post("/:id/projects", authenticateJWT, addProjectToOrganization);

// PATCH requests
router.patch("/:id", authenticateJWT, updateOrganizationById);

// DELETE requests
// router.delete("/:id", authenticateJWT, deleteOrganizationById);
// router.delete(
//   "/:id/members/:memberId",
//   authenticateJWT,
//   removeMemberFromOrganization
// );
// router.delete(
//   "/:id/projects/:projectId",
//   authenticateJWT,
//   removeProjectFromOrganization
// );

export default router;
