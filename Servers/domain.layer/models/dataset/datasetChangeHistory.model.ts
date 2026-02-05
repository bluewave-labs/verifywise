import { Column, DataType, Model, Table } from "sequelize-typescript";
import { IDatasetChangeHistory } from "../../interfaces/i.dataset";

@Table({
  tableName: "dataset_change_histories",
  timestamps: false,
  underscored: true,
  indexes: [
    {
      name: "idx_dataset_change_history_dataset_id",
      fields: ["dataset_id"],
    },
    {
      name: "idx_dataset_change_history_changed_at",
      fields: ["changed_at"],
    },
    {
      name: "idx_dataset_change_history_composite",
      fields: ["dataset_id", "changed_at"],
    },
  ],
})
export class DatasetChangeHistoryModel
  extends Model<DatasetChangeHistoryModel>
  implements IDatasetChangeHistory
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    references: {
      model: "datasets",
      key: "id",
    },
    onDelete: "CASCADE",
  })
  dataset_id!: number;

  @Column({
    type: DataType.ENUM("created", "updated", "deleted"),
    allowNull: false,
  })
  action!: "created" | "updated" | "deleted";

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  field_name?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  old_value?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  new_value?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id",
    },
  })
  changed_by_user_id?: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  changed_at?: Date;

  /**
   * Check if this is a creation record
   */
  isCreation(): boolean {
    return this.action === "created";
  }

  /**
   * Check if this is an update record
   */
  isUpdate(): boolean {
    return this.action === "updated";
  }

  /**
   * Check if this is a deletion record
   */
  isDeletion(): boolean {
    return this.action === "deleted";
  }

  /**
   * Get a human-readable description of the change
   */
  getChangeDescription(): string {
    if (this.action === "created") {
      return "Dataset was created";
    }
    if (this.action === "deleted") {
      return "Dataset was deleted";
    }
    if (this.field_name) {
      return `Field "${this.field_name}" was changed`;
    }
    return "Dataset was updated";
  }

  toJSON(): any {
    return {
      id: this.id,
      dataset_id: this.dataset_id,
      action: this.action,
      field_name: this.field_name,
      old_value: this.old_value,
      new_value: this.new_value,
      changed_by_user_id: this.changed_by_user_id,
      changed_at: this.changed_at?.toISOString?.() || this.changed_at,
    };
  }

  constructor(init?: Partial<IDatasetChangeHistory>) {
    super();
    Object.assign(this, init);
  }
}
