import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ProjectRiskModel } from "../../models/projectRisks/projectRisk.model";
import { SubClauseISOModel } from "./subClauseISO.model";

export type SubClauseISORisks = {
  subclause_id?: number;
  projects_risks_id?: number;
};

@Table({
  tableName: "subclauses_iso__risks",
})
export class SubClauseISORisksModel extends Model<SubClauseISORisks> {
  @ForeignKey(() => SubClauseISOModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  subclause_id?: number;

  @ForeignKey(() => ProjectRiskModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  projects_risks_id?: number;
}
