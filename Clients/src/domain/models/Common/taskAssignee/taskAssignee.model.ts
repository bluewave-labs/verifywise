export class TaskAssigneeModel {
  task_id!: number;
  user_id!: number;
  assigned_at?: Date;

  constructor(data: TaskAssigneeModel) {
    this.task_id = data.task_id;
    this.user_id = data.user_id;
    this.assigned_at = data.assigned_at;
  }

  static createTaskAssignee(data: TaskAssigneeModel): TaskAssigneeModel {
    return new TaskAssigneeModel(data);
  }
}
