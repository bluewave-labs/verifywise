/**
 * @file role.route.ts
 * @description This file defines the routes for role-related operations in the application.
 * It uses Express.js to handle HTTP requests and routes them to the appropriate controller functions.
 *
 * Routes:
 * - GET /: Retrieves all roles.
 * - GET /:id: Retrieves a specific role by its ID.
 * - POST /: Creates a new role.
 * - PUT /:id: Updates an existing role by its ID.
 * - DELETE /:id: Deletes a role by its ID.
 *
 * Controllers:
 * - createRole: Handles the creation of a new role.
 * - deleteRoleById: Handles the deletion of a role by its ID.
 * - getAllRoles: Handles retrieving all roles.
 * - getRoleById: Handles retrieving a specific role by its ID.
 * - updateRoleById: Handles updating an existing role by its ID.
 *
 * @module routes/role
 * @requires express
 * @requires ../controllers/role.ctrl
 */

import express from "express";
import {
  createRole,
  deleteRoleById,
  getAllRoles,
  getRoleById,
  updateRoleById,
} from "../controllers/role.ctrl";
const router = express.Router();

// GET requests
router.get("/", getAllRoles);
router.get("/:id", getRoleById);

// POST, PUT, DELETE requests
router.post("/", createRole);
router.put("/:id", updateRoleById);
router.delete("/:id", deleteRoleById);

export default router;
