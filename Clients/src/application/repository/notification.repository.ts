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

// Note: SSE connection is handled by the useNotifications hook using fetch() with Authorization header.
// This provides better security than URL-based token passing.
