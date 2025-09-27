import { TaskPriority, TaskStatus } from "../../../interfaces/i.task";

export class TaskModel {
  id?: number;
  title!: string;
  description?: string;
  creator_id!: number;
  organization_id!: number;
  due_date?: Date;
  priority!: TaskPriority;
  status!: TaskStatus;
  categories?: string[];
  created_at?: Date;
  updated_at?: Date;

  constructor(data: TaskModel) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.creator_id = data.creator_id;
    this.organization_id = data.organization_id;
    this.due_date = data.due_date;
    this.priority = data.priority;
    this.status = data.status;
    this.categories = data.categories;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static createTask(data: TaskModel): TaskModel {
    return new TaskModel(data);
  }
}
