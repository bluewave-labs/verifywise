import { Column, DataType, Model, Table } from "sequelize-typescript";

export type AITrustCenterIntro = {
  id?: number;
  intro_visible: boolean;
  purpose_visible: boolean;
  purpose_text?: string;
  our_statement_visible: boolean;
  our_statement_text?: string;
  our_mission_visible: boolean;
  our_mission_text?: string;
  organization_id: number;
  createdAt?: Date;
  updatedAt?: Date;
};

@Table({
  tableName: "ai_trust_center_intro",
  timestamps: true,
})
export class AITrustCenterIntroModel extends Model<AITrustCenterIntro> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  intro_visible!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  purpose_visible!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  purpose_text?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  our_statement_visible!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  our_statement_text?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  our_mission_visible!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  our_mission_text?: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  organization_id!: number;
}