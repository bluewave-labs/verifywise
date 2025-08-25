import { TasksModel } from "../domain.layer/models/tasks/tasks.model";
import { UserModel } from "../domain.layer/models/user/user.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction, Op, WhereOptions, OrderItem } from "sequelize";
import { ITask } from "../domain.layer/interfaces/i.task";
import { TaskStatus } from "../domain.layer/enums/task-status.enum";
import { TaskPriority } from "../domain.layer/enums/task-priority.enum";
import { IRoleAttributes } from "../domain.layer/interfaces/i.role";

interface GetTasksOptions {
  userId: number;
  role: IRoleAttributes["name"];
  transaction?: Transaction;
}

interface TaskFilters {
  status?: string[];
  due_date_start?: string;
  due_date_end?: string;
  category?: string[];
  assignee?: number[];
  organization_id?: number;
}

interface TaskSortOptions {
  sort_by?: 'due_date' | 'priority' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
}

// Create a new task
export const createNewTaskQuery = async (
  task: ITask,
  tenant: string,
  transaction: Transaction
): Promise<TasksModel> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".tasks (
        title, description, creator_id, organization_id, due_date, priority, status, categories
      ) VALUES (
        :title, :description, :creator_id, :organization_id, :due_date, :priority, :status, :categories
      ) RETURNING *`,
    {
      replacements: {
        title: task.title,
        description: task.description || null,
        creator_id: task.creator_id,
        organization_id: task.organization_id,
        due_date: task.due_date || null,
        priority: task.priority || TaskPriority.MEDIUM,
        status: task.status || TaskStatus.OPEN,
        categories: JSON.stringify(task.categories || []),
      },
      model: TasksModel,
      mapToModel: true,
      transaction,
    }
  );
  return result[0] as TasksModel;
};

// GET /tasks: Fetch list with filters (status, due_date range, category, assignee) and sorts (due_date, priority, created_at). Apply pagination (25 items per page, server-side). Enforce visibility rules.
export const getTasksQuery = async (
  { userId, role }: GetTasksOptions,
  tenant: string,
  filters: TaskFilters = {},
  sort: TaskSortOptions = {},
  options?: { limit?: number; offset?: number }
): Promise<TasksModel[]> => {
  const { limit, offset } = options ?? {};
  const { sort_by = 'created_at', sort_order = 'DESC' } = sort;

  // Build base query parts following project utils pattern
  const baseQueryParts: string[] = [`SELECT DISTINCT t.*`, `FROM "${tenant}".tasks t`];

  // Build pagination clause 
  const paginationClause =
    limit !== undefined && offset !== undefined
      ? "LIMIT :limit OFFSET :offset"
      : limit !== undefined
        ? "LIMIT :limit"
        : "";

  const whereConditions: string[] = ["t.status != :deletedStatus"];
  const replacements: any = {
    deletedStatus: TaskStatus.DELETED,
  };

  // Enforce visibility rules: admins see all, others see tasks where they're creator or assignee
  if (role !== "Admin") {
    baseQueryParts.push(
      `LEFT JOIN "${tenant}".task_assignees ta ON ta.task_id = t.id AND ta.user_id = :userId`
    );
    whereConditions.push("(t.creator_id = :userId OR ta.user_id IS NOT NULL)");
    replacements.userId = userId;
  }

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    const statusList = filters.status.map((s, i) => `:status${i}`).join(', ');
    whereConditions.push(`t.status IN (${statusList})`);
    filters.status.forEach((status, i) => {
      replacements[`status${i}`] = status;
    });
  }

  if (filters.due_date_start) {
    whereConditions.push(`t.due_date >= :due_date_start`);
    replacements.due_date_start = filters.due_date_start;
  }

  if (filters.due_date_end) {
    whereConditions.push(`t.due_date <= :due_date_end`);
    replacements.due_date_end = filters.due_date_end;
  }

  if (filters.category && filters.category.length > 0) {
    // For JSONB array contains any of the categories
    const categoryConditions = filters.category.map((j, i) => `t.categories::jsonb ? :category${i}`).join(' OR ');
    whereConditions.push(`(${categoryConditions})`);
    filters.category.forEach((cat, i) => {
      replacements[`category${i}`] = cat;
    });
  }

  if (filters.assignee && filters.assignee.length > 0) {
    // Add LEFT JOIN for assignee filter if not already added
    if (role === "Admin") {
      baseQueryParts.push(
        `LEFT JOIN "${tenant}".task_assignees ta_filter ON ta_filter.task_id = t.id`
      );
    }
    const assigneeList = filters.assignee.map((_, i) => `:assignee${i}`).join(', ');
    const joinAlias = role === "Admin" ? "ta_filter" : "ta";
    whereConditions.push(`${joinAlias}.user_id IN (${assigneeList})`);
    filters.assignee.forEach((assignee, i) => {
      replacements[`assignee${i}`] = assignee;
    });
  }

  if (filters.organization_id) {
    whereConditions.push(`t.organization_id = :organization_id`);
    replacements.organization_id = filters.organization_id;
  }

  // Add WHERE conditions
  if (whereConditions.length > 0) {
    baseQueryParts.push("WHERE " + whereConditions.join(" AND "));
  }

  // Build ORDER clause for sorts (due_date, priority, created_at)
  if (sort_by === 'priority') {
    // Custom priority ordering: High=1, Medium=2, Low=3
    baseQueryParts.push(`ORDER BY CASE 
      WHEN t.priority = :priorityHigh THEN 1 
      WHEN t.priority = :priorityMedium THEN 2 
      WHEN t.priority = :priorityLow THEN 3 
      END ${sort_order}, t.created_at DESC`);
    replacements.priorityHigh = TaskPriority.HIGH;
    replacements.priorityMedium = TaskPriority.MEDIUM;
    replacements.priorityLow = TaskPriority.LOW;
  } else {
    // Validate sort_by to prevent SQL injection
    const allowedSortFields = ['due_date', 'created_at'];
    if (!allowedSortFields.includes(sort_by)) {
      throw new Error('Invalid sort field');
    }
    // Validate sort_order to prevent SQL injection
    const allowedSortOrders = ['ASC', 'DESC'];
    if (!allowedSortOrders.includes(sort_order)) {
      throw new Error('Invalid sort order');
    }
    const orderClause = `ORDER BY t.${sort_by} ${sort_order}`;
    if (sort_by !== 'created_at') {
      baseQueryParts.push(orderClause + ', t.created_at DESC');
    } else {
      baseQueryParts.push(orderClause);
    }
  }

  // Add pagination
  if (paginationClause) {
    baseQueryParts.push(paginationClause);
  }

  // Add pagination parameters to replacements
  if (limit !== undefined) replacements.limit = limit;
  if (offset !== undefined) replacements.offset = offset;

  const finalQuery = baseQueryParts.join("\n");

  // Get tasks with pagination
  const tasks = await sequelize.query(finalQuery, {
    replacements,
    mapToModel: true,
    model: TasksModel,
    type: QueryTypes.SELECT,
  });

  return tasks as TasksModel[];
};

// Get task by ID with role-based visibility
export const getTaskByIdQuery = async (
  taskId: number,
  { userId, role }: GetTasksOptions,
  tenant: string
): Promise<TasksModel | null> => {
  const baseQueryParts: string[] = [`SELECT DISTINCT t.*`, `FROM "${tenant}".tasks t`];
  const whereConditions: string[] = ["t.id = :taskId", "t.status != :deletedStatus"];
  const replacements: any = { 
    taskId,
    deletedStatus: TaskStatus.DELETED,
  };

  // Role-based visibility rules
  if (role !== "Admin") {
    baseQueryParts.push(
      `LEFT JOIN "${tenant}".task_assignees ta ON ta.task_id = t.id AND ta.user_id = :userId`
    );
    whereConditions.push("(t.creator_id = :userId OR ta.user_id IS NOT NULL)");
    replacements.userId = userId;
  }

  baseQueryParts.push("WHERE " + whereConditions.join(" AND "));
  const finalQuery = baseQueryParts.join("\n");

  const tasks = await sequelize.query(finalQuery, {
    replacements,
    mapToModel: true,
    model: TasksModel,
    type: QueryTypes.SELECT,
  });
  
  return tasks.length > 0 ? (tasks[0] as TasksModel) : null;
};

// Update task with permission checks
export const updateTaskByIdQuery = async (
  {
    id,
    task,
    userId,
    role,
    transaction,
  }: {
    id: number;
    task: Partial<ITask>;
    userId: number;
    role: string;
    transaction: Transaction;
  },
  tenant: string
): Promise<TasksModel> => {
  // First, get the task to check permissions
  const existingTask = await getTaskByIdQuery(id, { userId, role }, tenant);
  
  if (!existingTask) {
    throw new Error("Task not found");
  }

  // Permission checks for specific fields
  const isCreator = existingTask.creator_id === userId;
  const isAdmin = role === "Admin";

  // Check if user is assignee using task_assignees table
  const assigneeCheck = await sequelize.query(
    `SELECT 1 FROM "${tenant}".task_assignees WHERE task_id = :taskId AND user_id = :userId`,
    {
      replacements: { taskId: id, userId },
      type: QueryTypes.SELECT,
    }
  );
  const isAssignee = assigneeCheck.length > 0;

  // Restrict who can update certain fields - only admin can edit due_date and priority
  if ((task.due_date !== undefined || task.priority !== undefined) && !isAdmin) {
    throw new Error("Only admin can update due_date and priority");
  }

  // Anyone involved (creator, assignee, admin) can update status
  if (task.status !== undefined && !isCreator && !isAssignee && !isAdmin) {
    throw new Error("Only task creator, assignee, or admin can update status");
  }

  const updateTask: Partial<Record<keyof ITask, any>> = {};
  const setClause = [
    "title",
    "description", 
    "due_date",
    "priority",
    "status",
    "categories",
  ]
    .filter((f) => {
      if (task[f as keyof ITask] !== undefined) {
        updateTask[f as keyof ITask] = f === "categories" 
          ? JSON.stringify(task[f as keyof ITask]) 
          : task[f as keyof ITask];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".tasks SET ${setClause} WHERE id = :id RETURNING *;`;

  updateTask.id = id;

  const result: TasksModel[] = await sequelize.query(query, {
    replacements: updateTask,
    model: TasksModel,
    mapToModel: true,
    type: QueryTypes.SELECT,
    transaction,
  });

  return result[0];
};

// Soft delete task (only creator or admin)
export const deleteTaskByIdQuery = async (
  {
    id,
    userId,
    role,
    transaction,
  }: {
    id: number;
    userId: number;
    role: string;
    transaction: Transaction;
  },
  tenant: string
): Promise<boolean> => {
  const task = await getTaskByIdQuery(id, { userId, role }, tenant);
  
  if (!task) {
    return false;
  }

  // Only creator or admin can delete
  const isCreator = task.creator_id === userId;
  const isAdmin = role === "Admin";

  if (!isCreator && !isAdmin) {
    throw new Error("Only task creator or admin can delete tasks");
  }

  // Soft delete by setting status to DELETED
  await sequelize.query(
    `UPDATE "${tenant}".tasks SET status = :status WHERE id = :id`,
    {
      replacements: {
        status: TaskStatus.DELETED,
        id: id,
      },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );
  
  return true;
};

