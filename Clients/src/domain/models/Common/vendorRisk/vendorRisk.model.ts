export class VendorRiskModel {
  id?: number;
  vendor_id!: number;
  order_no?: number;
  risk_description!: string;
  impact_description!: string;
  impact!: "Negligible" | "Minor" | "Moderate" | "Major" | "Critical";
  likelihood!: "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost certain";
  risk_severity!:
    | "Negligible"
    | "Minor"
    | "Moderate"
    | "Major"
    | "Catastrophic";
  action_plan!: string;
  action_owner!: number;
  risk_level!: string;
  is_demo?: boolean;
  created_at?: Date;

  constructor(data: VendorRiskModel) {
    this.id = data.id;
    this.vendor_id = data.vendor_id;
    this.order_no = data.order_no;
    this.risk_description = data.risk_description;
    this.impact_description = data.impact_description;
    this.impact = data.impact;
    this.likelihood = data.likelihood;
    this.risk_severity = data.risk_severity;
    this.action_plan = data.action_plan;
    this.action_owner = data.action_owner;
    this.risk_level = data.risk_level;
    this.is_demo = data.is_demo;
    this.created_at = data.created_at;
  }

  static createNewVendorRisk(data: VendorRiskModel): VendorRiskModel {
    return new VendorRiskModel(data);
  }
}
