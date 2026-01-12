import { Router } from "express";
import { streamNotifications } from "../controllers/notification.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

const router = Router();

/**
 * SSE endpoint for real-time notifications
 * GET /api/notifications/stream
 * Protected by JWT authentication (Authorization header)
 * Uses standard authenticateJWT middleware
 */
router.get("/stream", authenticateJWT, streamNotifications);

export default router;
