import { Column, DataType, ForeignKey, Model, Table, BelongsTo } from "sequelize-typescript";
import { UserModel } from "../user/user.model";
import { IModelInventoryHistory } from "../../interfaces/i.modelInventoryHistory";

@Table({
  tableName: "model_inventory_history",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
})
export class ModelInventoryHistoryModel extends Model<ModelInventoryHistoryModel> implements IModelInventoryHistory {
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
  parameter!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  snapshot_data!: Record<string, number>;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  recorded_at!: Date;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  triggered_by_user_id?: number;

  @BelongsTo(() => UserModel)
  triggered_by_user?: UserModel;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  change_description?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at?: Date;
}
