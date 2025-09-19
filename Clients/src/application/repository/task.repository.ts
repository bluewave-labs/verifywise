import { apiServices } from "../../infrastructure/api/networkServices";
import { getAuthToken } from "../redux/auth/getAuthToken";
import { ITask, TaskStatus, TaskPriority } from "../../domain/interfaces/i.task";

/**
 * Retrieves all tasks with optional filtering, sorting, and pagination
 *
 * @param {object} params - Query parameters for filtering and pagination
 * @param {AbortSignal} [signal] - Optional abort signal for canceling the request
 * @param {string} [authToken] - Optional auth token, defaults to stored token
 * @returns {Promise<any>} The tasks data with pagination info
 * @throws Will throw an error if the request fails
 */
export async function getAllTasks({
  signal,
  authToken = getAuthToken(),
  status,
  priority,
  category,
  assignee,
  due_date_start,
  due_date_end,
  search,
  include_archived,
  sort_by = 'created_at',
  sort_order = 'DESC',
  page = '1',
  page_size = '25'
}: {
  signal?: AbortSignal;
  authToken?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: string[];
  assignee?: number[];
  due_date_start?: string;
  due_date_end?: string;
  search?: string;
  include_archived?: boolean;
  sort_by?: 'due_date' | 'priority' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
  page?: string;
  page_size?: string;
} = {}): Promise<any> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (status?.length) {
      status.forEach(s => params.append('status', s));
    }
    if (priority?.length) {
      priority.forEach(p => params.append('priority', p));
    }
    if (category?.length) {
      category.forEach(c => params.append('category', c));
    }
    if (assignee?.length) {
      assignee.forEach(a => params.append('assignee', a.toString()));
    }
    if (due_date_start) params.append('due_date_start', due_date_start);
    if (due_date_end) params.append('due_date_end', due_date_end);
    if (search) params.append('search', search);
    if (include_archived) params.append('include_archived', 'true');
    
    params.append('sort_by', sort_by);
    params.append('sort_order', sort_order);
    params.append('page', page);
    params.append('page_size', page_size);

    const queryString = params.toString();
    const url = `/tasks${queryString ? `?${queryString}` : ''}`;

    const response = await apiServices.get(url, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}

/**
 * Retrieves a single task by its ID
 *
 * @param {object} params - Parameters for the request
 * @param {string} params.id - The task ID
 * @param {AbortSignal} [params.signal] - Optional abort signal
 * @param {string} [params.authToken] - Optional auth token
 * @returns {Promise<any>} The task data
 * @throws Will throw an error if the request fails
 */
export async function getTaskById({
  id,
  signal,
  authToken = getAuthToken(),
}: {
  id: string | number;
  signal?: AbortSignal;
  authToken?: string;
}): Promise<any> {
  try {
    const response = await apiServices.get(`/tasks/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    throw error;
  }
}

/**
 * Creates a new task
 *
 * @param {object} params - Parameters for creating a task
 * @param {Partial<ITask>} params.body - The task data
 * @param {string} [params.authToken] - Optional auth token
 * @returns {Promise<any>} The created task data
 * @throws Will throw an error if the request fails
 */
export async function createTask({
  body,
  authToken = getAuthToken(),
}: {
  body: Partial<ITask>;
  authToken?: string;
}): Promise<any> {
  try {
    const response = await apiServices.post("/tasks", body, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

/**
 * Updates an existing task by its ID
 *
 * @param {object} params - Parameters for updating a task
 * @param {string|number} params.id - The task ID
 * @param {Partial<ITask>} params.body - The updated task data
 * @param {string} [params.authToken] - Optional auth token
 * @returns {Promise<any>} The updated task data
 * @throws Will throw an error if the request fails
 */
export async function updateTask({
  id,
  body,
  authToken = getAuthToken(),
}: {
  id: string | number;
  body: Partial<ITask>;
  authToken?: string;
}): Promise<any> {
  try {
    const response = await apiServices.put(`/tasks/${id}`, body, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

/**
 * Deletes a task by its ID
 *
 * @param {object} params - Parameters for deleting a task
 * @param {string|number} params.id - The task ID
 * @param {string} [params.authToken] - Optional auth token
 * @returns {Promise<any>} The deletion response
 * @throws Will throw an error if the request fails
 */
export async function deleteTask({
  id,
  authToken = getAuthToken(),
}: {
  id: string | number;
  authToken?: string;
}): Promise<any> {
  try {
    const response = await apiServices.delete(`/tasks/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}

/**
 * Updates only the status of a task (quick status change)
 *
 * @param {object} params - Parameters for updating task status
 * @param {string|number} params.id - The task ID
 * @param {TaskStatus} params.status - The new status
 * @param {string} [params.authToken] - Optional auth token
 * @returns {Promise<any>} The updated task data
 * @throws Will throw an error if the request fails
 */
export async function updateTaskStatus({
  id,
  status,
  authToken = getAuthToken(),
}: {
  id: string | number;
  status: TaskStatus;
  authToken?: string;
}): Promise<any> {
  try {
    const response = await apiServices.put(`/tasks/${id}`, { status }, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}