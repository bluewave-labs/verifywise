import { TaskPriority, TaskStatus } from "../enums/task.enum";

export interface ITask {
  id?: number;
  title: string;
  description?: string;
  creator_id: number;
  organization_id?: number;
  due_date?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  categories?: string[];
  created_at?: Date;
  updated_at?: Date;
  creator_name?: string;
  assignees?: ITaskAssignee[];
  isOverdue?: boolean;
}

export interface ITaskAssignee {
  user_id: number;
  user_name: string;
  user_avatar?: string;
  assigned_at?: Date;
}

export interface TaskSummary {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface TaskFilters {
  search: string;
  status: "all" | TaskStatus;
  priority: "all" | TaskPriority;
  assignee: "all" | string;
  category: "all" | string;
}

export interface ICreateTaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  assignees: Array<{
    id: number;
    name: string;
    surname: string;
    email: string;
  }>;
  categories: string[];
}

export interface ICreateTaskProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: (data: ICreateTaskFormValues) => void;
  initialData?: ITask;
  mode?: "create" | "edit";
}

export interface ICreateTaskFormErrors {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  assignees?: string;
  categories?: string;
}
