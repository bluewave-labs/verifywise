import { Column, DataType, Model, Table } from "sequelize-typescript";
import { ITrainingRegister } from "../../interfaces/i.trainingRegister";

@Table({
  tableName: "trainingregistar",
})
export class TrainingRegistarModel
  extends Model<TrainingRegistarModel>
  implements ITrainingRegister
{
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;
  @Column({
    type: DataType.STRING,
  })
  training_name!: string;

  @Column({
    type: DataType.STRING,
  })
  duration!: string;

  @Column({
    type: DataType.STRING,
  })
  provider!: string;

  @Column({
    type: DataType.STRING,
  })
  department!: string;

  @Column({
    type: DataType.ENUM("Planned", "In Progress", "Completed"),
  })
  status!: "Planned" | "In Progress" | "Completed";

  @Column({
    type: DataType.INTEGER,
  })
  numberOfPeople!: number;

  @Column({
    type: DataType.STRING,
  })
  description!: string;
}
