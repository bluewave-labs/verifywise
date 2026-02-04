import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import {
  INotification,
  INotificationJSON,
  ICreateNotification,
  INotificationFilters,
  INotificationSummary,
  IBulkNotification,
  NotificationEntityType,
} from "../domain.layer/interfaces/i.notification";

/**
 * Convert a notification record to JSON format
 */
const toJSON = (notification: INotification): INotificationJSON => ({
  id: notification.id!,
  user_id: notification.user_id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  entity_type: notification.entity_type,
  entity_id: notification.entity_id,
  entity_name: notification.entity_name,
  action_url: notification.action_url,
  is_read: notification.is_read,
  read_at: notification.read_at ? notification.read_at.toISOString() : null,
  created_at: notification.created_at!.toISOString(),
  created_by: notification.created_by,
  metadata: notification.metadata,
});

/**
 * Create a new notification
 */
export const createNotificationQuery = async (
  notification: ICreateNotification,
  tenant: string,
  transaction?: Transaction
): Promise<INotificationJSON> => {
  const result = await sequelize.query<INotification>(
    `INSERT INTO "${tenant}".notifications (
      user_id, type, title, message, entity_type, entity_id,
      entity_name, action_url, created_by, metadata
    ) VALUES (
      :user_id, :type, :title, :message, :entity_type, :entity_id,
      :entity_name, :action_url, :created_by, :metadata
    ) RETURNING *`,
    {
      replacements: {
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entity_type: notification.entity_type || null,
        entity_id: notification.entity_id || null,
        entity_name: notification.entity_name || null,
        action_url: notification.action_url || null,
        created_by: notification.created_by || null,
        metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
      },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return toJSON(result[0]);
};

/**
 * Create notifications for multiple users (bulk)
 */
export const createBulkNotificationsQuery = async (
  bulk: IBulkNotification,
  tenant: string,
  transaction?: Transaction
): Promise<INotificationJSON[]> => {
  if (bulk.user_ids.length === 0) {
    return [];
  }

  // Build values for multi-row insert
  const values = bulk.user_ids
    .map((_, i) => `(:user_id_${i}, :type, :title, :message, :entity_type, :entity_id, :entity_name, :action_url, :created_by, :metadata)`)
    .join(", ");

  const replacements: Record<string, any> = {
    type: bulk.type,
    title: bulk.title,
    message: bulk.message,
    entity_type: bulk.entity_type || null,
    entity_id: bulk.entity_id || null,
    entity_name: bulk.entity_name || null,
    action_url: bulk.action_url || null,
    created_by: bulk.created_by || null,
    metadata: bulk.metadata ? JSON.stringify(bulk.metadata) : null,
  };

  bulk.user_ids.forEach((userId, i) => {
    replacements[`user_id_${i}`] = userId;
  });

  const result = await sequelize.query<INotification>(
    `INSERT INTO "${tenant}".notifications (
      user_id, type, title, message, entity_type, entity_id,
      entity_name, action_url, created_by, metadata
    ) VALUES ${values} RETURNING *`,
    {
      replacements,
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return result.map(toJSON);
};

/**
 * Get notifications for a user with filters
 */
export const getNotificationsQuery = async (
  userId: number,
  tenant: string,
  filters: INotificationFilters = {}
): Promise<INotificationJSON[]> => {
  const whereConditions: string[] = ["user_id = :userId"];
  const replacements: Record<string, any> = { userId };

  if (filters.type) {
    if (Array.isArray(filters.type)) {
      const typeList = filters.type.map((_, i) => `:type_${i}`).join(", ");
      whereConditions.push(`type IN (${typeList})`);
      filters.type.forEach((t, i) => {
        replacements[`type_${i}`] = t;
      });
    } else {
      whereConditions.push("type = :type");
      replacements.type = filters.type;
    }
  }

  if (filters.entity_type) {
    whereConditions.push("entity_type = :entity_type");
    replacements.entity_type = filters.entity_type;
  }

  if (filters.entity_id) {
    whereConditions.push("entity_id = :entity_id");
    replacements.entity_id = filters.entity_id;
  }

  if (filters.is_read !== undefined) {
    whereConditions.push("is_read = :is_read");
    replacements.is_read = filters.is_read;
  }

  if (filters.from_date) {
    whereConditions.push("created_at >= :from_date");
    replacements.from_date = filters.from_date;
  }

  if (filters.to_date) {
    whereConditions.push("created_at <= :to_date");
    replacements.to_date = filters.to_date;
  }

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  replacements.limit = limit;
  replacements.offset = offset;

  const result = await sequelize.query<INotification>(
    `SELECT * FROM "${tenant}".notifications
     WHERE ${whereConditions.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT :limit OFFSET :offset`,
    {
      replacements,
      type: QueryTypes.SELECT,
    }
  );

  return result.map(toJSON);
};

/**
 * Get notification summary for bell icon
 */
export const getNotificationSummaryQuery = async (
  userId: number,
  tenant: string
): Promise<INotificationSummary> => {
  // Get unread count
  const countResult = await sequelize.query<{ unread_count: string; total_count: string }>(
    `SELECT
      COUNT(*) FILTER (WHERE is_read = FALSE) AS unread_count,
      COUNT(*) AS total_count
     FROM "${tenant}".notifications
     WHERE user_id = :userId`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  );

  // Get recent notifications (last 10)
  const recentResult = await sequelize.query<INotification>(
    `SELECT * FROM "${tenant}".notifications
     WHERE user_id = :userId
     ORDER BY created_at DESC
     LIMIT 10`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  );

  return {
    unread_count: parseInt(countResult[0]?.unread_count || "0", 10),
    total_count: parseInt(countResult[0]?.total_count || "0", 10),
    recent_notifications: recentResult.map(toJSON),
  };
};

/**
 * Get a single notification by ID
 */
export const getNotificationByIdQuery = async (
  notificationId: number,
  userId: number,
  tenant: string
): Promise<INotificationJSON | null> => {
  const result = await sequelize.query<INotification>(
    `SELECT * FROM "${tenant}".notifications
     WHERE id = :notificationId AND user_id = :userId`,
    {
      replacements: { notificationId, userId },
      type: QueryTypes.SELECT,
    }
  );

  if (result.length === 0) {
    return null;
  }

  return toJSON(result[0]);
};

/**
 * Mark a notification as read
 */
export const markNotificationAsReadQuery = async (
  notificationId: number,
  userId: number,
  tenant: string,
  transaction?: Transaction
): Promise<INotificationJSON | null> => {
  const result = await sequelize.query<INotification>(
    `UPDATE "${tenant}".notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE id = :notificationId AND user_id = :userId
     RETURNING *`,
    {
      replacements: { notificationId, userId },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  if (result.length === 0) {
    return null;
  }

  return toJSON(result[0]);
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsReadQuery = async (
  userId: number,
  tenant: string,
  transaction?: Transaction
): Promise<number> => {
  const result = await sequelize.query(
    `UPDATE "${tenant}".notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE user_id = :userId AND is_read = FALSE`,
    {
      replacements: { userId },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );

  return result[1] as number;
};

/**
 * Delete a notification
 */
export const deleteNotificationQuery = async (
  notificationId: number,
  userId: number,
  tenant: string,
  transaction?: Transaction
): Promise<boolean> => {
  // Use RAW query to get affected row count
  const [, metadata] = await sequelize.query(
    `DELETE FROM "${tenant}".notifications
     WHERE id = :notificationId AND user_id = :userId`,
    {
      replacements: { notificationId, userId },
      transaction,
    }
  );

  return (metadata as number) > 0;
};

/**
 * Delete all read notifications older than a certain date
 * Used for cleanup
 */
export const deleteOldNotificationsQuery = async (
  userId: number,
  olderThan: Date,
  tenant: string,
  transaction?: Transaction
): Promise<number> => {
  // Use RAW query to get affected row count
  const [, metadata] = await sequelize.query(
    `DELETE FROM "${tenant}".notifications
     WHERE user_id = :userId
     AND is_read = TRUE
     AND created_at < :olderThan`,
    {
      replacements: { userId, olderThan },
      transaction,
    }
  );

  return metadata as number;
};

/**
 * Get unread count for a user
 */
export const getUnreadCountQuery = async (
  userId: number,
  tenant: string
): Promise<number> => {
  const result = await sequelize.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${tenant}".notifications
     WHERE user_id = :userId AND is_read = FALSE`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  );

  return parseInt(result[0]?.count || "0", 10);
};

/**
 * Delete notifications by entity (when entity is deleted)
 */
export const deleteNotificationsByEntityQuery = async (
  entityType: NotificationEntityType,
  entityId: number,
  tenant: string,
  transaction?: Transaction
): Promise<number> => {
  const [, metadata] = await sequelize.query(
    `DELETE FROM "${tenant}".notifications
     WHERE entity_type = :entityType AND entity_id = :entityId`,
    {
      replacements: { entityType, entityId },
      transaction,
    }
  );

  return metadata as number;
};

/**
 * Get users who should receive a notification for an entity
 * This is a utility function to help determine notification recipients
 */
export const getEntityNotificationRecipientsQuery = async (
  entityType: NotificationEntityType,
  entityId: number,
  tenant: string,
  excludeUserId?: number
): Promise<number[]> => {
  let query = "";
  const replacements: Record<string, any> = { entityId };

  switch (entityType) {
    case NotificationEntityType.PROJECT:
      // Get all project members
      query = `
        SELECT DISTINCT user_id
        FROM "${tenant}".projects_members
        WHERE project_id = :entityId
      `;
      break;

    case NotificationEntityType.TASK:
      // Get task creator and assignees
      query = `
        SELECT creator_id as user_id FROM "${tenant}".tasks WHERE id = :entityId
        UNION
        SELECT user_id FROM "${tenant}".task_assignees WHERE task_id = :entityId
      `;
      break;

    case NotificationEntityType.POLICY:
      // Get policy owner and reviewers
      query = `
        SELECT owner_id as user_id FROM "${tenant}".policies WHERE id = :entityId
        UNION
        SELECT reviewer_id as user_id FROM "${tenant}".policies WHERE id = :entityId AND reviewer_id IS NOT NULL
      `;
      break;

    case NotificationEntityType.VENDOR:
      // Get vendor assignee and reviewers
      query = `
        SELECT assignee as user_id FROM "${tenant}".vendors WHERE id = :entityId AND assignee IS NOT NULL
        UNION
        SELECT reviewer as user_id FROM "${tenant}".vendors WHERE id = :entityId AND reviewer IS NOT NULL
      `;
      break;

    default:
      return [];
  }

  if (excludeUserId) {
    query = `SELECT user_id FROM (${query}) sub WHERE user_id != :excludeUserId`;
    replacements.excludeUserId = excludeUserId;
  }

  const result = await sequelize.query<{ user_id: number }>(query, {
    replacements,
    type: QueryTypes.SELECT,
  });

  return result.map((r) => r.user_id).filter((id) => id != null);
};
