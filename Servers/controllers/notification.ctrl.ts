import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getNotificationsQuery,
  getNotificationSummaryQuery,
  markNotificationAsReadQuery,
  markAllNotificationsAsReadQuery,
  deleteNotificationQuery,
  getUnreadCountQuery,
} from "../utils/notification.utils";
import { INotificationFilters, NotificationType } from "../domain.layer/interfaces/i.notification";

// Store active SSE connections
// Key: `${tenantId}:${userId}`
// Value: Connection metadata with Response object
interface ConnectionData {
  response: Response;
  tenantId: string;
  userId: number;
  connectedAt: Date;
}

const connections = new Map<string, ConnectionData>();

/**
 * SSE endpoint - establishes persistent connection for real-time notifications
 * GET /api/notifications/stream
 */
export const streamNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, tenantId } = req;

  if (!userId || !tenantId) {
    console.error("❌ Missing userId or tenantId");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Note: The authenticateToken middleware already validates:
    // 1. User belongs to the organization
    // 2. tenantId matches organizationId
    // So we can trust req.userId and req.tenantId here

    const connectionKey = `${tenantId}:${userId}`;

    // Setup SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // SECURITY: Store connection with tenant validation data
    connections.set(connectionKey, {
      response: res,
      tenantId: tenantId,
      userId: userId,
      connectedAt: new Date(),
    });

    console.log(`SSE connection established: ${connectionKey}`);

    // Send initial connection success message
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (error) {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(heartbeatInterval);
      connections.delete(connectionKey);
      console.log(`SSE connection closed: ${connectionKey}`);
    });
  } catch (error) {
    console.error("Error establishing SSE connection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get connection by key (used by Redis subscriber)
 */
export const getConnection = (key: string): ConnectionData | undefined => {
  return connections.get(key);
};

/**
 * Get all active connections (for debugging)
 */
export const getActiveConnections = (): number => {
  return connections.size;
};

/**
 * Periodic cleanup of stale connections (optional safety measure)
 */
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 3600000; // 1 hour

  for (const [key, data] of connections.entries()) {
    if (now - data.connectedAt.getTime() > staleThreshold) {
      console.warn(`Cleaning up stale connection: ${key}`);
      connections.delete(key);
    }
  }
}, 60000); // Check every minute

/**
 * Get notifications for the current user
 * GET /api/notifications
 */
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, tenantId } = req;

  if (!userId || !tenantId) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  try {
    const filters: INotificationFilters = {
      is_read: req.query.is_read === "true" ? true : req.query.is_read === "false" ? false : undefined,
      type: req.query.type as NotificationType | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const notifications = await getNotificationsQuery(userId, tenantId, filters);
    return res.status(200).json(STATUS_CODE[200](notifications));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json(STATUS_CODE[500]("Failed to fetch notifications"));
  }
};

/**
 * Get notification summary (for bell icon)
 * GET /api/notifications/summary
 */
export const getNotificationSummary = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, tenantId } = req;

  if (!userId || !tenantId) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  try {
    const summary = await getNotificationSummaryQuery(userId, tenantId);
    return res.status(200).json(STATUS_CODE[200](summary));
  } catch (error) {
    console.error("Error fetching notification summary:", error);
    return res.status(500).json(STATUS_CODE[500]("Failed to fetch notification summary"));
  }
};

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, tenantId } = req;

  if (!userId || !tenantId) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  try {
    const count = await getUnreadCountQuery(userId, tenantId);
    return res.status(200).json(STATUS_CODE[200]({ unread_count: count }));
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json(STATUS_CODE[500]("Failed to fetch unread count"));
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, tenantId } = req;
  const idParam = req.params.id;
  const notificationId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

  if (!userId || !tenantId) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  if (isNaN(notificationId)) {
    return res.status(400).json(STATUS_CODE[400]("Invalid notification ID"));
  }

  try {
    const notification = await markNotificationAsReadQuery(notificationId, userId, tenantId);

    if (!notification) {
      return res.status(404).json(STATUS_CODE[404]("Notification not found"));
    }

    return res.status(200).json(STATUS_CODE[200](notification));
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json(STATUS_CODE[500]("Failed to mark notification as read"));
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, tenantId } = req;

  if (!userId || !tenantId) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  try {
    const count = await markAllNotificationsAsReadQuery(userId, tenantId);
    return res.status(200).json(STATUS_CODE[200]({ marked_count: count }));
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json(STATUS_CODE[500]("Failed to mark notifications as read"));
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId, tenantId } = req;
  const idParam = req.params.id;
  const notificationId = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

  if (!userId || !tenantId) {
    return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
  }

  if (isNaN(notificationId)) {
    return res.status(400).json(STATUS_CODE[400]("Invalid notification ID"));
  }

  try {
    const deleted = await deleteNotificationQuery(notificationId, userId, tenantId);

    if (!deleted) {
      return res.status(404).json(STATUS_CODE[404]("Notification not found"));
    }

    return res.status(200).json(STATUS_CODE[200]({ deleted: true }));
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json(STATUS_CODE[500]("Failed to delete notification"));
  }
};
