import express from "express";
const router = express.Router();

import {
  createRole,
  deleteRoleById,
  getAllRoles,
  getRoleById,
  updateRoleById,
} from "../controllers/role.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllRoles);
router.get("/:id", authenticateJWT, getRoleById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createRole);
router.put("/:id", authenticateJWT, updateRoleById);
router.delete("/:id", authenticateJWT, deleteRoleById);

export default router;
