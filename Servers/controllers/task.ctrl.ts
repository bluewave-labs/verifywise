import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewTaskQuery,
  getTasksQuery,
  getTaskByIdQuery,
  updateTaskByIdQuery,
  deleteTaskByIdQuery,
} from "../utils/task.utils";
import { sequelize } from "../database/db";
import { TasksModel } from "../domain.layer/models/tasks/tasks.model";
import { ITask } from "../domain.layer/interfaces/i.task";
import { TaskPriority } from "../domain.layer/enums/task-priority.enum";
import { TaskStatus } from "../domain.layer/enums/task-status.enum";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";
import { ValidationException, BusinessLogicException } from "../domain.layer/exceptions/custom.exception";

export async function createTask(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting createTask",
    functionName: "createTask",
    fileName: "task.ctrl.ts",
  });

  const transaction = await sequelize.transaction();
  try {
    const { userId } = req;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, description, due_date, priority, status, categories } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json(STATUS_CODE[400]("Task title is required"));
    }

    // Validate priority enum
    if (priority && !Object.values(TaskPriority).includes(priority)) {
      return res.status(400).json(STATUS_CODE[400](`Invalid priority. Must be one of: ${Object.values(TaskPriority).join(', ')}`));
    }

    // Validate status enum
    if (status && !Object.values(TaskStatus).includes(status)) {
      return res.status(400).json(STATUS_CODE[400](`Invalid status. Must be one of: ${Object.values(TaskStatus).join(', ')}`));
    }

    // Create task with current user as creator
    const taskData: ITask = {
      title,
      description,
      creator_id: userId,
      due_date: due_date ? new Date(due_date) : undefined,
      priority: priority || TaskPriority.MEDIUM,
      status: status || TaskStatus.OPEN,
      categories: categories || [],
    };

    const task = await createNewTaskQuery(taskData, req.tenantId!, transaction);

    await transaction.commit();

    await logSuccess({
      eventType: "Create",
      description: `Created new task: ${title}`,
      functionName: "createTask",
      fileName: "task.ctrl.ts",
    });

    return res.status(201).json(STATUS_CODE[201](task));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      await logFailure({
        eventType: "Create",
        description: `Validation failed: ${error.message}`,
        functionName: "createTask",
        fileName: "task.ctrl.ts",
        error: error as Error,
      });
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      await logFailure({
        eventType: "Create",
        description: `Business logic error: ${error.message}`,
        functionName: "createTask",
        fileName: "task.ctrl.ts",
        error: error as Error,
      });
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    await logFailure({
      eventType: "Create",
      description: "Failed to create task",
      functionName: "createTask",
      fileName: "task.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getAllTasks(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllTasks",
    functionName: "getAllTasks",
    fileName: "task.ctrl.ts",
  });

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Extract query parameters for filters, sorting, and pagination
    const {
      status,
      due_date_start,
      due_date_end,
      category,
      assignee,
      sort_by = 'created_at',
      sort_order = 'DESC',
      page = '1',
      page_size = '25'
    } = req.query;
    console.log({ status, due_date_start, due_date_end, category, assignee, sort_by, sort_order, page, page_size }, "-------------task query-------------");

    // Parse filters
    const filters: any = {};
    if (status) filters.status = Array.isArray(status) ? status : [status];
    if (due_date_start) filters.due_date_start = due_date_start as string;
    if (due_date_end) filters.due_date_end = due_date_end as string;
    if (category) filters.category = Array.isArray(category) ? category : [category];
    if (assignee) filters.assignee = Array.isArray(assignee) ? assignee.map(Number) : [Number(assignee)];

    // Parse sorting
    const sort = {
      sort_by: sort_by as 'due_date' | 'priority' | 'created_at',
      sort_order: sort_order as 'ASC' | 'DESC'
    };

    // Parse pagination
    const pageNum = parseInt(page as string, 10);
    const pageSize = parseInt(page_size as string, 10);
    const limit = Math.min(pageSize, 100); // Cap at 100 items per page
    const offset = (pageNum - 1) * limit;

    const tasks = await getTasksQuery(
      { userId, role },
      req.tenantId!,
      filters,
      sort,
      { limit, offset }
    );

    // Calculate pagination metadata
    const totalTasks = tasks.length; // This is just the current page, we'd need a count query for real total
    const pagination = {
      page: pageNum,
      pageSize: limit,
      total: totalTasks, // This would need to be calculated properly
      totalPages: Math.ceil(totalTasks / limit),
      hasNext: tasks.length === limit,
      hasPrev: pageNum > 1
    };

    await logSuccess({
      eventType: "Read",
      description: "Retrieved tasks list",
      functionName: "getAllTasks",
      fileName: "task.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200]({
      tasks,
      pagination
    }));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve tasks",
      functionName: "getAllTasks",
      fileName: "task.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getTaskById(req: Request, res: Response): Promise<any> {
  const taskId = parseInt(req.params.id);

  logProcessing({
    description: `starting getTaskById for ID ${taskId}`,
    functionName: "getTaskById",
    fileName: "task.ctrl.ts",
  });

  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const task = await getTaskByIdQuery(taskId, { userId, role }, req.tenantId!);

    if (task) {
      await logSuccess({
        eventType: "Read",
        description: `Retrieved task ID ${taskId}`,
        functionName: "getTaskById",
        fileName: "task.ctrl.ts",
      });

      return res.status(200).json(STATUS_CODE[200](task));
    }

    await logSuccess({
      eventType: "Read",
      description: `Task not found: ID ${taskId}`,
      functionName: "getTaskById",
      fileName: "task.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve task by ID",
      functionName: "getTaskById",
      fileName: "task.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateTask(req: Request, res: Response): Promise<any> {
  const taskId = parseInt(req.params.id);

  logProcessing({
    description: `starting updateTask for ID ${taskId}`,
    functionName: "updateTask",
    fileName: "task.ctrl.ts",
  });

  const transaction = await sequelize.transaction();
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updateData: Partial<ITask> = {};
    const { title, description, due_date, priority, status, categories } = req.body;

    // Only include fields that are being updated
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : undefined;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (categories !== undefined) updateData.categories = categories;

    const updatedTask = await updateTaskByIdQuery(
      {
        id: taskId,
        task: updateData,
        userId,
        role,
        transaction,
      },
      req.tenantId!
    );

    await transaction.commit();

    await logSuccess({
      eventType: "Update",
      description: `Updated task ID ${taskId}`,
      functionName: "updateTask",
      fileName: "task.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](updatedTask));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Update",
      description: "Failed to update task",
      functionName: "updateTask",
      fileName: "task.ctrl.ts",
      error: error as Error,
    });

    const statusCode = (error as Error).message.includes("not found") ? 404 : 
                      (error as Error).message.includes("Only") ? 403 : 500;

    return res.status(statusCode).json(STATUS_CODE[statusCode]((error as Error).message));
  }
}

export async function deleteTask(req: Request, res: Response): Promise<any> {
  const taskId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteTask for ID ${taskId}`,
    functionName: "deleteTask",
    fileName: "task.ctrl.ts",
  });

  const transaction = await sequelize.transaction();
  try {
    const { userId, role } = req;
    if (!userId || !role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deleted = await deleteTaskByIdQuery(
      {
        id: taskId,
        userId,
        role,
        transaction,
      },
      req.tenantId!
    );

    await transaction.commit();

    if (deleted) {
      await logSuccess({
        eventType: "Delete",
        description: `Deleted task ID ${taskId}`,
        functionName: "deleteTask",
        fileName: "task.ctrl.ts",
      });

      return res.status(200).json(STATUS_CODE[200]({ message: "Task deleted successfully" }));
    }

    await logSuccess({
      eventType: "Delete",
      description: `Task not found for deletion: ID ${taskId}`,
      functionName: "deleteTask",
      fileName: "task.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Delete",
      description: "Failed to delete task",
      functionName: "deleteTask",
      fileName: "task.ctrl.ts",
      error: error as Error,
    });

    const statusCode = (error as Error).message.includes("not found") ? 404 : 
                      (error as Error).message.includes("Only") ? 403 : 500;

    return res.status(statusCode).json(STATUS_CODE[statusCode]((error as Error).message));
  }
}