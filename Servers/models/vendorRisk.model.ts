import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { VendorModel } from "./vendor.model";
import { UserModel } from "./user.model";

/*

This is the new VendorRisk model(Schema) and will be replaced with the new one.
Please align other files with this

*/
export type VendorRisk = {
  id?: number; // auto generated by database
  vendor_id?: number; // won't get any values, will be filled by user
  order_no?: number; // gets assigned from the structure
  risk_description: string;
  impact_description: string;
  impact: "Negligible" | "Minor" | "Moderate" | "Major" | "Critical";
  likelihood: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost certain";
  risk_severity: "Negligible" | "Minor" | "Moderate" | "Major" | "Catastrophic";
  action_plan: string;
  action_owner: number;
  risk_level: string;
};

@Table({
  tableName: "vendor_risks"
})
export class VendorRiskModel extends Model<VendorRisk> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id?: number;

  @ForeignKey(() => VendorModel)
  @Column({
    type: DataType.INTEGER
  })
  vendor_id!: number;

  @Column({
    type: DataType.INTEGER
  })
  order_no?: number;

  @Column({
    type: DataType.STRING
  })
  risk_description!: string;

  @Column({
    type: DataType.STRING
  })
  impact_description!: string;

  @Column({
    type: DataType.ENUM("Negligible", "Minor", "Moderate", "Major", "Critical")
  })
  impact!: "Negligible" | "Minor" | "Moderate" | "Major" | "Critical";

  @Column({
    type: DataType.ENUM("Rare", "Unlikely", "Possible", "Likely", "Almost certain")
  })
  likelihood!: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost certain";

  @Column({
    type: DataType.ENUM("Negligible", "Minor", "Moderate", "Major", "Catastrophic")
  })
  risk_severity!: "Negligible" | "Minor" | "Moderate" | "Major" | "Catastrophic"

  @Column({
    type: DataType.STRING
  })
  action_plan!: string;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER
  })
  action_owner!: number;

  @Column({
    type: DataType.STRING
  })
  risk_level!: string;

  @Column({
    type: DataType.BOOLEAN,
  })
  is_demo?: boolean;
}
