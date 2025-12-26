/**
 * Task Repository Interface
 *
 * Defines the contract for task data access operations.
 */

import { TaskPriority, TaskStatus } from "../enums/task.enum";
import { ITask } from "../interfaces/i.task";
import { PaginatedResponse } from "./IBaseRepository";

/**
 * Task filter options
 */
export interface TaskFilterOptions {
  signal?: AbortSignal;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: string[];
  assignee?: number[];
  due_date_start?: string;
  due_date_end?: string;
  search?: string;
  include_archived?: boolean;
  sort_by?: "due_date" | "priority" | "created_at";
  sort_order?: "ASC" | "DESC";
  page?: string;
  page_size?: string;
}

/**
 * Task Repository Interface
 */
export interface ITaskRepository {
  /**
   * Get all tasks with optional filtering
   */
  getAll(options?: TaskFilterOptions): Promise<PaginatedResponse<ITask>>;

  /**
   * Get a task by ID
   */
  getById(id: string | number, options?: { signal?: AbortSignal }): Promise<ITask>;

  /**
   * Create a new task
   */
  create(data: Partial<ITask>): Promise<ITask>;

  /**
   * Update a task
   */
  update(id: string | number, data: Partial<ITask>): Promise<ITask>;

  /**
   * Delete a task (soft delete/archive)
   */
  delete(id: string | number): Promise<void>;

  /**
   * Update task status only
   */
  updateStatus(id: string | number, status: TaskStatus): Promise<ITask>;

  /**
   * Restore an archived task
   */
  restore(id: string | number): Promise<ITask>;

  /**
   * Permanently delete a task
   */
  hardDelete(id: string | number): Promise<void>;
}
