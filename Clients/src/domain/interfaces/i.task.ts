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

export enum TaskPriority {
  LOW = "Low",
  MEDIUM = "Medium", 
  HIGH = "High",
}

export enum TaskStatus {
  OPEN = "Open",
  IN_PROGRESS = "In progress",
  COMPLETED = "Completed",
  OVERDUE = "Overdue",
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
  status: 'all' | TaskStatus;
  priority: 'all' | TaskPriority;
  assignee: 'all' | string;
  category: 'all' | string;
}