import { Router } from "express";
import {
  streamNotifications,
  getNotifications,
  getNotificationSummary,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

const router = Router();

/**
 * SSE endpoint for real-time notifications
 * GET /api/notifications/stream
 * Protected by JWT authentication (Authorization header)
 */
router.get("/stream", authenticateJWT, streamNotifications);

/**
 * Get notifications for current user
 * GET /api/notifications
 * Query params: is_read, type, limit, offset
 */
router.get("/", authenticateJWT, getNotifications);

/**
 * Get notification summary (for bell icon badge)
 * GET /api/notifications/summary
 */
router.get("/summary", authenticateJWT, getNotificationSummary);

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get("/unread-count", authenticateJWT, getUnreadCount);

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch("/read-all", authenticateJWT, markAllAsRead);

/**
 * Mark a specific notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", authenticateJWT, markAsRead);

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete("/:id", authenticateJWT, deleteNotification);

export default router;
