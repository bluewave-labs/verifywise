import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { ProjectRiskModel } from "../../models/projectRisks/projectRisk.model";
import { AnnexCategoryISOModel } from "./annexCategoryISO.model";

export type AnnexCategoryISORisks = {
  annexcategory_id?: number;
  project_risk_id?: number;
};

@Table({
  tableName: "annexcategory_risks_iso",
})
export class AnnexCategoryISORisksModel extends Model<AnnexCategoryISORisks> {
  @ForeignKey(() => AnnexCategoryISOModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  annexcategory_id?: number;

  @ForeignKey(() => ProjectRiskModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  project_risk_id?: number;
}
