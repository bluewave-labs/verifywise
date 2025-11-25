import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { RiskModel } from "../../models/risks/risk.model";
import { NISTAIMRFSubcategoryModel } from "./nist_ai_rmf_subcategory.model";
import { INISTAIMRFSubcategoryRisks } from "../../interfaces/i.nist_ai_rmf_subcategory_risks";

@Table({
  tableName: "nist_ai_rmf_subcategories__risks",
})
export class NISTAIMRFSubcategoryRisksModel extends Model<INISTAIMRFSubcategoryRisks> {
  @ForeignKey(() => NISTAIMRFSubcategoryModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  subcategory_id?: number;

  @ForeignKey(() => RiskModel)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  projects_risks_id?: number;
}