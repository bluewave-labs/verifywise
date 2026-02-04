import { apiServices } from "../../infrastructure/api/networkServices";

/**
 * Notification types matching backend enum
 */
export type NotificationType =
  | "task_assigned"
  | "task_completed"
  | "review_requested"
  | "review_approved"
  | "review_rejected"
  | "approval_requested"
  | "approval_approved"
  | "approval_rejected"
  | "policy_due_soon"
  | "policy_overdue"
  | "training_assigned"
  | "training_completed"
  | "vendor_review_due"
  | "file_uploaded"
  | "comment_added"
  | "mention"
  | "system";

/**
 * Entity type for notification context
 */
export type NotificationEntityType =
  | "project"
  | "task"
  | "policy"
  | "vendor"
  | "model"
  | "training"
  | "file"
  | "use_case"
  | "risk"
  | "assessment"
  | "comment"
  | "user";

/**
 * Notification interface
 */
export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: NotificationEntityType | null;
  entity_id?: number | null;
  entity_name?: string | null;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  created_by?: number | null;
  metadata?: Record<string, any> | null;
}

/**
 * Notification summary for bell icon
 */
export interface NotificationSummary {
  unread_count: number;
  total_count: number;
  recent_notifications: Notification[];
}

/**
 * Get notifications with optional filters
 */
export const getNotifications = async (params?: {
  is_read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}): Promise<Notification[]> => {
  const queryParams = new URLSearchParams();
  if (params?.is_read !== undefined) {
    queryParams.append("is_read", String(params.is_read));
  }
  if (params?.type) {
    queryParams.append("type", params.type);
  }
  if (params?.limit) {
    queryParams.append("limit", String(params.limit));
  }
  if (params?.offset) {
    queryParams.append("offset", String(params.offset));
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/notifications?${queryString}` : "/notifications";

  const response = await apiServices.get(url);
  return response.data.data;
};

/**
 * Get notification summary for bell icon
 */
export const getNotificationSummary = async (): Promise<NotificationSummary> => {
  const response = await apiServices.get("/notifications/summary");
  return response.data.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiServices.get("/notifications/unread-count");
  return response.data.data.unread_count;
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  notificationId: number
): Promise<Notification> => {
  const response = await apiServices.patch(
    `/notifications/${notificationId}/read`
  );
  return response.data.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<{
  marked_count: number;
}> => {
  const response = await apiServices.patch("/notifications/read-all");
  return response.data.data;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: number
): Promise<{ deleted: boolean }> => {
  const response = await apiServices.delete(`/notifications/${notificationId}`);
  return response.data.data;
};

/**
 * Connect to SSE stream for real-time notifications
 * Returns a cleanup function to close the connection
 */
export const connectNotificationStream = (
  onNotification: (notification: Notification) => void,
  onConnect?: () => void,
  onError?: (error: Event) => void
): (() => void) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found for notification stream");
    return () => {};
  }

  // Create EventSource with auth token in query params (SSE limitation)
  const baseUrl = import.meta.env.VITE_APP_API_URL || "";
  const streamUrl = `${baseUrl}/notifications/stream`;

  // Use fetch with EventSource polyfill pattern for auth header support
  // Standard EventSource doesn't support custom headers
  let eventSource: EventSource | null = null;

  const connect = async () => {
    try {
      // For now, use URL with token param (not ideal but works)
      // In production, consider using a session-based approach
      eventSource = new EventSource(`${streamUrl}?token=${token}`);

      eventSource.onopen = () => {
        console.log("📡 Notification stream connected");
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle connection confirmation
          if (data.type === "connected") {
            console.log("✅ Notification stream authenticated");
            return;
          }

          // Handle actual notifications
          if (data.id && data.title) {
            onNotification(data as Notification);
          }
        } catch (parseError) {
          console.error("Failed to parse notification:", parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error("Notification stream error:", error);
        onError?.(error);
      };
    } catch (error) {
      console.error("Failed to connect to notification stream:", error);
    }
  };

  connect();

  // Return cleanup function
  return () => {
    if (eventSource) {
      eventSource.close();
      console.log("📴 Notification stream disconnected");
    }
  };
};
