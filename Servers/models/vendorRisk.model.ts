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
  risk_severity:
    | "Very low risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";
  action_plan: string;
  action_owner: number;
  risk_level: string;
};

// export type VendorRisk = {
//   id: number;
//   project_id: number; // Foreign key to refer to the project
//   vendor_name: string;
//   risk_name: string;
//   owner: string;
//   risk_level:
//     | "No risk"
//     | "Low risk"
//     | "Medium risk"
//     | "High risk"
//     | "Very high risk"; // Restrict to specified values
//   review_date: Date;
// };
