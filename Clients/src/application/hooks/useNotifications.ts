/**
 * @fileoverview Real-time notification hook using Server-Sent Events (SSE)
 *
 * Establishes a persistent SSE connection to receive real-time approval workflow notifications.
 * Integrates with the existing Alert system to display notifications to users.
 *
 * Features:
 * - Authorization header (uses existing JWT, no cookies!)
 * - fetch() with ReadableStream (manual SSE parsing for full header control)
 * - Automatic reconnection on connection loss
 * - Multi-tenant safe
 * - Integrates with existing alert system
 * - Proper cleanup on unmount
 *
 * How it works:
 * 1. Uses fetch() instead of EventSource to send Authorization header
 * 2. Manually parses SSE data from ReadableStream
 * 3. Receives real-time notifications
 *
 * @module hooks/useNotifications
 */

import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ENV_VARs } from "../../../env.vars";
import { showAlert } from "../../infrastructure/api/customAxios";

interface Notification {
  type: "approval_request" | "approval_approved" | "approval_rejected" | "approval_complete" | "connected";
  title?: string;
  message?: string;
  entityId?: number;
  entityType?: string;
}

interface UseNotificationsOptions {
  /** Enable notifications (default: true) */
  enabled?: boolean;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds (default: 3000) */
  reconnectDelay?: number;
  /** Callback function to be called when a notification is received */
  onNotification?: (notification: Notification) => void;
}

/**
 * Hook to manage real-time notifications via SSE
 *
 * @param options - Configuration options for the notification system
 * @returns Object with connection status and manual control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, reconnect } = useNotifications({ enabled: true });
 *
 *   return (
 *     <div>
 *       {isConnected ? "Connected" : "Disconnected"}
 *       <button onClick={reconnect}>Reconnect</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const {
    enabled = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    onNotification,
  } = options;

  const authToken = useSelector((state: RootState) => state.auth.authToken);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyDisconnectedRef = useRef(false);
  const isConnectedRef = useRef(false);

  /**
   * Display notification using existing alert system
   */
  const displayNotification = useCallback((notification: Notification) => {
    // Skip "connected" type - it's just for internal handshake
    if (notification.type === "connected") {
      return;
    }

    // Call the onNotification callback if provided
    if (onNotification) {
      onNotification(notification);
    }

    // Map notification types to alert variants
    const alertVariants: Record<string, "success" | "info" | "warning" | "error"> = {
      approval_request: "info",
      approval_approved: "success",
      approval_rejected: "error",
      approval_complete: "success",
    };

    const variant = alertVariants[notification.type] || "info";

    showAlert({
      variant,
      title: notification.title,
      body: notification.message || "You have a new notification",
    });
  }, [onNotification]);

  /**
   * Connect to SSE endpoint using fetch() with Authorization header
   */
  const connect = useCallback(async () => {
    // Don't connect if disabled or no auth token
    if (!enabled || !authToken) {
      return;
    }

    // Clean up existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const url = `${ENV_VARs.URL}/api/notifications/stream`;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      isManuallyDisconnectedRef.current = false;

      // Use fetch() instead of EventSource to send custom headers
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      isConnectedRef.current = true;

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete messages (separated by \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim()) continue;

          // Parse SSE message format
          const lines = message.split('\n');
          let data = '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              data = line.substring(6); // Remove "data: " prefix
            } else if (line.startsWith(':')) {
              // Ignore comments (heartbeat)
              continue;
            }
          }

          if (data) {
            try {
              const notification: Notification = JSON.parse(data);
              displayNotification(notification);
            } catch (_error) {
              // Silently ignore parsing errors
            }
          }
        }
      }

      // Stream ended, reconnect if not manually disconnected
      isConnectedRef.current = false;
      if (autoReconnect && !isManuallyDisconnectedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      }
    } catch (error: any) {
      isConnectedRef.current = false;

      // Don't reconnect if manually aborted
      if (error.name === 'AbortError') {
        return;
      }

      // Auto-reconnect if enabled and not manually disconnected
      if (autoReconnect && !isManuallyDisconnectedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      }
    }
  }, [enabled, authToken, autoReconnect, reconnectDelay, displayNotification]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = true;
    isConnectedRef.current = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Manually trigger reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      isManuallyDisconnectedRef.current = false;
      connect();
    }, 100);
  }, [connect, disconnect]);

  // Auto-connect on mount and when dependencies change
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: isConnectedRef.current,
    reconnect,
    disconnect,
  };
};
