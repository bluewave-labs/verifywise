import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ProjectRiskModel } from "../../models/projectRisks/projectRisk.model";
import { ControlEUModel } from "./controlEU.model";

export type ControlsEURisks = {
  control_id?: number;
  projects_risks_id?: number;
};

@Table({
  tableName: "controls_eu__risks",
})
export class ControlsEURisksModel extends Model<ControlsEURisks> {
  @ForeignKey(() => ControlEUModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  control_id?: number;

  @ForeignKey(() => ProjectRiskModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  projects_risks_id?: number;
}
