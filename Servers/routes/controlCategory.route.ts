import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/" /*authenticateJWT, */);
router.get("/:id" /*authenticateJWT, */);

// POSTs
router.post("/" /*authenticateJWT, */);

// PUTs
router.put("/:id" /*authenticateJWT, */);

// DELETEs
router.delete("/:id" /*authenticateJWT, */);

export default router;
