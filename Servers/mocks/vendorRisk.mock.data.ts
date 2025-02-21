import { VendorRisk } from "../models/vendorRisk.model";

// Sample mock data for VendorRisk
const mockVendorRisks = (project1: number, project2: number): VendorRisk[] => {
  return [
    {
      id: 1,
      vendor_id: 1,
      order_no: 1,
      risk_description: "Data Security",
      impact_description: "Alice",
      impact: "Critical",
      likelihood: "Almost certain",
      risk_severity: "High risk",
      action_plan: "Vendor Risk 1 action plan",
      action_owner: "Matt",
      risk_level: "High risk",
    },
    {
      id: 2,
      vendor_id: 2,
      order_no: 1,
      risk_description: "Service Reliability",
      impact_description: "Bob",
      impact: "Major",
      likelihood: "Likely",
      risk_severity: "High risk",
      action_plan: "Vendor Risk 2 action plan",
      action_owner: "Martin",
      risk_level: "Medium risk",
    },
    {
      id: 3,
      vendor_id: 3,
      order_no: 1,
      risk_description: "Compliance Risk",
      impact_description: "Charlie",
      impact: "Moderate",
      likelihood: "Possible",
      risk_severity: "Very high risk",
      action_plan: "Vendor Risk 3 action plan",
      action_owner: "John",
      risk_level: "Low risk",
    },
    {
      id: 4,
      vendor_id: 4,
      order_no: 1,
      risk_description: "Network Vulnerability",
      impact_description: "David",
      impact: "Moderate",
      likelihood: "Rare",
      risk_severity: "No risk",
      action_plan: "Vendor Risk 4 action plan",
      action_owner: "Zack",
      risk_level: "Very high risk",
    }
  ]
};

// Export the mock data for use in other files
export default mockVendorRisks;
