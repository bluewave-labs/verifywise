import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { TaskPriority } from "../../enums/task-priority.enum";
import { TaskStatus } from "../../enums/task-status.enum";
import { ITask, ITaskSafeJSON, ITaskJSON } from "../../interfaces/i.task";


@Table({
  tableName: "tasks",
  timestamps: true,
})
export class TasksModel extends Model<TasksModel> implements ITask {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  creator_id!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_date?: Date;

  @Column({
    type: DataType.ENUM(...Object.values(TaskPriority)),
    allowNull: false,
    defaultValue: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.OPEN,
  })
  status!: TaskStatus;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  categories?: string[];

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  created_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updated_at?: Date;

  static createNewTask(task: ITask): TasksModel {
    return new TasksModel(task);
  }

  async updateTask(updateData: {
    title?: string;
    description?: string;
    creator_id?: number;
    due_date?: Date;
    priority?: TaskPriority;
    status?: TaskStatus;
    categories?: string[];
    is_deleted?: boolean;
  }): Promise<void> {
    if (updateData.title !== undefined) {
      this.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      this.description = updateData.description;
    }
    if (updateData.creator_id !== undefined) {
      this.creator_id = updateData.creator_id;
    }
    if (updateData.due_date !== undefined) {
      this.due_date = updateData.due_date;
    }
    if (updateData.priority !== undefined) {
      this.priority = updateData.priority;
    }
    if (updateData.status !== undefined) {
      this.status = updateData.status;
    }
    if (updateData.categories !== undefined) {
      this.categories = updateData.categories;
    }
  }

  /**
   * Check if the task is overdue
   */
  isOverdue(): boolean {
    if (!this.due_date || (this.status === TaskStatus.COMPLETED || this.status === TaskStatus.DELETED)) return false;
    return new Date() > this.due_date;
  }


  /**
   * Get task data 
   */
  toSafeJSON(): ITaskSafeJSON {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      creator_id: this.creator_id,
      due_date: this.due_date?.toISOString(),
      priority: this.priority,
      status: this.status,
      categories: this.categories,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
    };
  }

  /**
   * Convert task model to JSON representation
   */
  toJSON(): ITaskJSON {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      creator_id: this.creator_id,
      due_date: this.due_date?.toISOString(),
      priority: this.priority,
      status: this.status,
      categories: this.categories,
      created_at: this.created_at?.toISOString(),
      updated_at: this.updated_at?.toISOString(),
      isOverdue: this.isOverdue(),
    };
  }

  constructor(init?: Partial<ITask>) {
    super();
    if (init) {
      Object.assign(this, init);
    }
  }
}