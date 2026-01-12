import { Request, Response } from "express";

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
