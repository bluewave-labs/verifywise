import { TasksModel } from "../domain.layer/models/tasks/tasks.model";
import { TaskAssigneesModel } from "../domain.layer/models/taskAssignees/taskAssignees.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction, Op, WhereOptions, OrderItem } from "sequelize";
import { ITask } from "../domain.layer/interfaces/i.task";
import { TaskStatus } from "../domain.layer/enums/task-status.enum";
import { TaskPriority } from "../domain.layer/enums/task-priority.enum";
import { IRoleAttributes } from "../domain.layer/interfaces/i.role";
import { 
  NotFoundException, 
  ForbiddenException, 
  ValidationException
} from "../domain.layer/exceptions/custom.exception";

interface GetTasksOptions {
  userId: number;
  role: IRoleAttributes["name"];
  transaction?: Transaction;
}

interface TaskFilters {
  status?: string[];
  priority?: string[];
  due_date_start?: string;
  due_date_end?: string;
  category?: string[];
  assignee?: number[];
  organization_id?: number;
  search?: string;
}

interface TaskSortOptions {
  sort_by?: 'due_date' | 'priority' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
}

interface QueryReplacements {
  [key: string]: any;
}


// Helper function for DRY visibility logic - adds JOIN and WHERE conditions for non-Admin users
const addVisibilityLogic = (
  baseQueryParts: string[],
  whereConditions: string[],
  replacements: QueryReplacements,
  { userId, role }: GetTasksOptions,
  tenant: string,
  organizationId: number,
  joinAlias: string = 'ta'
): void => {
  // SECURITY: Always filter by organization_id to prevent cross-organization access
  whereConditions.push("t.organization_id = :organizationId");
  replacements.organizationId = organizationId;
  
  if (role !== "Admin") {
    baseQueryParts.push(
      `LEFT JOIN "${tenant}".task_assignees ${joinAlias} ON ${joinAlias}.task_id = t.id AND ${joinAlias}.user_id = :userId`
    );
    whereConditions.push(`(t.creator_id = :userId OR ${joinAlias}.user_id IS NOT NULL)`);
    replacements.userId = userId;
  }
};

// Create a new task
export const createNewTaskQuery = async (
  task: ITask,
  tenant: string,
  transaction: Transaction,
  assignees?: Array<{ user_id: number }>
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
  
  const createdTask = result[0] as TasksModel;
  
  // Handle assignees following the project members pattern
  (createdTask.dataValues as any)["assignees"] = [];
  
  if (assignees && assignees.length > 0) {
    for (let assignee of assignees) {
      // Handle both formats: string/number directly, or object with user_id property
      const userId = typeof assignee === 'string' || typeof assignee === 'number' 
        ? Number(assignee) 
        : Number(assignee.user_id);
        
      if (!isNaN(userId) && userId > 0) {
        await sequelize.query(
          `INSERT INTO "${tenant}".task_assignees (task_id, user_id) VALUES (:task_id, :user_id) RETURNING *`,
          {
            replacements: { 
              task_id: createdTask.id, 
              user_id: userId 
            },
            transaction,
          }
        );
        (createdTask.dataValues as any)["assignees"].push(userId);
      }
    }
  }
  
  return createdTask;
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
  const replacements: QueryReplacements = {
    deletedStatus: TaskStatus.DELETED,
  };

  // Enforce visibility rules: admins see all, others see tasks where they're creator or assignee
  addVisibilityLogic(baseQueryParts, whereConditions, replacements, { userId, role }, tenant, filters.organization_id!);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    const statusList = filters.status.map((s, i) => `:status${i}`).join(', ');
    whereConditions.push(`t.status IN (${statusList})`);
    filters.status.forEach((status, i) => {
      replacements[`status${i}`] = status;
    });
  }

  if (filters.priority && filters.priority.length > 0) {
    const priorityList = filters.priority.map((p, i) => `:priority${i}`).join(', ');
    whereConditions.push(`t.priority IN (${priorityList})`);
    filters.priority.forEach((priority, i) => {
      replacements[`priority${i}`] = priority;
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

  if (filters.search) {
    whereConditions.push(`(t.title ILIKE :search OR t.description ILIKE :search)`);
    replacements.search = `%${filters.search}%`;
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
      throw new ValidationException(
        'Invalid sort field provided',
        'sort_by',
        sort_by
      );
    }
    // Validate sort_order to prevent SQL injection
    const allowedSortOrders = ['ASC', 'DESC'];
    if (!allowedSortOrders.includes(sort_order)) {
      throw new ValidationException(
        'Invalid sort order provided',
        'sort_order', 
        sort_order
      );
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

  // Add assignees to each task following the project members pattern
  for (const task of tasks) {
    const assignees = await sequelize.query(
      `SELECT user_id FROM "${tenant}".task_assignees WHERE task_id = :task_id`,
      {
        replacements: { task_id: task.id },
        mapToModel: true,
        model: TaskAssigneesModel,
      }
    );
    (task.dataValues as any)["assignees"] = assignees.map((a: any) => a.user_id);
  }

  return tasks as TasksModel[];
};

// Get task by ID with role-based visibility
export const getTaskByIdQuery = async (
  taskId: number,
  { userId, role }: GetTasksOptions,
  tenant: string,
  userOrganizationId: number
): Promise<TasksModel | null> => {
  const baseQueryParts: string[] = [`SELECT DISTINCT t.*`, `FROM "${tenant}".tasks t`];
  const whereConditions: string[] = ["t.id = :taskId", "t.status != :deletedStatus"];
  const replacements: QueryReplacements = { 
    taskId,
    deletedStatus: TaskStatus.DELETED,
  };

  // Role-based visibility rules
  addVisibilityLogic(baseQueryParts, whereConditions, replacements, { userId, role }, tenant, userOrganizationId);

  baseQueryParts.push("WHERE " + whereConditions.join(" AND "));
  const finalQuery = baseQueryParts.join("\n");

  const tasks = await sequelize.query(finalQuery, {
    replacements,
    mapToModel: true,
    model: TasksModel,
    type: QueryTypes.SELECT,
  });
  
  if (tasks.length > 0) {
    const task = tasks[0] as TasksModel;
    
    // Add assignees following the project members pattern
    const assignees = await sequelize.query(
      `SELECT user_id FROM "${tenant}".task_assignees WHERE task_id = :task_id`,
      {
        replacements: { task_id: task.id },
        mapToModel: true,
        model: TaskAssigneesModel,
      }
    );
    (task.dataValues as any)["assignees"] = assignees.map((a: any) => a.user_id);
    
    return task;
  }
  
  return null;
};

// Update task with permission checks
export const updateTaskByIdQuery = async (
  {
    id,
    task,
    userId,
    role,
    userOrganizationId,
    transaction,
  }: {
    id: number;
    task: Partial<ITask>;
    userId: number;
    role: string;
    userOrganizationId: number;
    transaction: Transaction;
  },
  tenant: string,
  assignees?: number[]
): Promise<TasksModel> => {
  // First, get the task to check permissions
  const existingTask = await getTaskByIdQuery(id, { userId, role }, tenant, userOrganizationId);
  
  if (!existingTask) {
    throw new NotFoundException(
      "Task not found or access denied",
      "task",
      id
    );
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

  // Restrict who can update certain fields - only admin and creator can edit due_date and priority
  if ((task.due_date !== undefined || task.priority !== undefined) && !isAdmin && !isCreator) {
    throw new ForbiddenException(
      "Only admin and creator can update due_date and priority",
      "task",
      "update_schedule_priority"
    );
  }

  // Anyone involved (creator, assignee, admin) can update status
  if (task.status !== undefined && !isCreator && !isAssignee && !isAdmin) {
    throw new ForbiddenException(
      "Only task creator, assignee, or admin can update status",
      "task",
      "update_status"
    );
  }

  const updateTask: QueryReplacements = {};
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

  if (!setClause) {
    throw new ValidationException(
      "No valid fields provided for update",
      "task",
      "update_fields"
    );
  }

  const query = `UPDATE "${tenant}".tasks SET ${setClause} WHERE id = :id RETURNING *;`;

  updateTask.id = id;

  const result: TasksModel[] = await sequelize.query(query, {
    replacements: updateTask,
    model: TasksModel,
    mapToModel: true,
    type: QueryTypes.SELECT,
    transaction,
  });

  const updatedTask = result[0];

  // Handle assignees update if provided
  if (assignees !== undefined) {
    // Remove existing assignees
    await sequelize.query(
      `DELETE FROM "${tenant}".task_assignees WHERE task_id = :taskId`,
      {
        replacements: { taskId: id },
        type: QueryTypes.DELETE,
        transaction,
      }
    );

    // Add new assignees if any
    if (assignees && assignees.length > 0) {
      const assigneeValues = assignees.map((assigneeId, index) => 
        `(:taskId, :assignee${index})`
      ).join(', ');
      
      const assigneeReplacements: any = { taskId: id };
      assignees.forEach((assigneeId, index) => {
        assigneeReplacements[`assignee${index}`] = assigneeId;
      });

      await sequelize.query(
        `INSERT INTO "${tenant}".task_assignees (task_id, user_id) VALUES ${assigneeValues}`,
        {
          replacements: assigneeReplacements,
          type: QueryTypes.INSERT,
          transaction,
        }
      );
    }

    // Add assignees to the response
    (updatedTask.dataValues as any)["assignees"] = assignees;
  }

  return updatedTask;
};

// Soft delete task (only creator or admin)
export const deleteTaskByIdQuery = async (
  {
    id,
    userId,
    role,
    transaction,
    organizationId
  }: {
    id: number;
    userId: number;
    role: string;
    transaction: Transaction;
    organizationId: number;
  },
  tenant: string
): Promise<boolean> => {
  const task = await getTaskByIdQuery(id, { userId, role }, tenant, organizationId);

  if (!task) {
    return false;
  }

  // Only creator or admin can delete
  const isCreator = task.creator_id === userId;
  const isAdmin = role === "Admin";

  if (!isCreator && !isAdmin) {
    throw new ForbiddenException(
      "Only task creator or admin can delete tasks",
      "task",
      "delete"
    );
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

