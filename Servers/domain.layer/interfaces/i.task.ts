import { TaskPriority } from "../enums/task-priority.enum";
import { TaskStatus } from "../enums/task-status.enum";

export interface ITask {
  id?: number;
  title: string;
  description?: string;
  assignee_id?: number;
  due_date?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  categories?: string[];
  created_at?: Date;
  updated_at?: Date;
}