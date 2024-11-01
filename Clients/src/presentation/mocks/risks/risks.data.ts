type Risk = {
  id: number;
  vendor_id: number;
  description: string;
  impact_description: string;
  impact: string;
  probability: string;
  action_owner: string;
  action_plan: string;
  risk_severity: string;
  risk_level: string;
  likelihood: string;
};

// Mock data for risks
const riskList: Risk[] = [
  {
    id: 1,
    vendor_id: 1,
    description: "Inconsistent model performance during peak loads",
    impact_description: "Potential delay in chatbot response times",
    impact: "High",
    probability: "4",
    action_owner: "John McAllen",
    action_plan:
      "Increase server capacity during peak hours to balance the load",
    risk_severity: "Critical",
    risk_level: "High",
    likelihood: "Probable",
  },
  {
    id: 2,
    vendor_id: 1,
    description: "Data leakage risk from model logs",
    impact_description: "Could expose sensitive user data",
    impact: "Critical",
    probability: "3",
    action_owner: "John McAllen",
    action_plan: "Implement stricter log management and encryption",
    risk_severity: "High",
    risk_level: "High",
    likelihood: "Possible",
  },
  {
    id: 3,
    vendor_id: 2,
    description: "Data sourcing biases leading to inaccurate model predictions",
    impact_description:
      "Negative impact on customer targeting in marketing campaigns",
    impact: "Moderate",
    probability: "3",
    action_owner: "Jessica Parker",
    action_plan:
      "Improve data quality checks and introduce more diverse datasets",
    risk_severity: "Major",
    risk_level: "Moderate",
    likelihood: "Possible",
  },
  {
    id: 4,
    vendor_id: 3,
    description:
      "Server downtime causing interruptions in AI compliance checks",
    impact_description: "Delays in regulatory compliance reports",
    impact: "Low",
    probability: "2",
    action_owner: "Michael Johnson",
    action_plan:
      "Schedule routine server maintenance and backups to minimize downtime",
    risk_severity: "Minor",
    risk_level: "Low",
    likelihood: "Unlikely",
  },
  {
    id: 5,
    vendor_id: 3,
    description: "Potential data access issues due to security gaps",
    impact_description:
      "Possible unauthorized access to sensitive compliance data",
    impact: "Moderate",
    probability: "2",
    action_owner: "Michael Johnson",
    action_plan: "Enhance security protocols and conduct regular audits",
    risk_severity: "Major",
    risk_level: "Moderate",
    likelihood: "Possible",
  },
];

export { riskList };
