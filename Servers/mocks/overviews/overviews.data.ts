export const overviews = [
  {
    id: 1,
    subrequirement_id: 1,
    control_name: "Privacy Policy Review",
    control_description: "Review and update the privacy policy to align with current consent requirements.",
    control_owner: "John Doe",
    control_status: "Completed",
    implementation_description: "Updated the privacy policy to reflect changes in user consent collection.",
    implementation_evidence: "Privacy Policy Document (v2.1)",
    effective_date: new Date("2024-06-01"),
    review_date: new Date("2024-12-01"),
    comments: "No issues encountered during implementation."
  },
  {
    id: 2,
    subrequirement_id: 1,
    control_name: "Opt-in Mechanism",
    control_description: "Develop and implement a user opt-in mechanism for consent collection.",
    control_owner: "Jane Smith",
    control_status: "In Progress",
    implementation_description: "Working on the integration of opt-in consent collection with the web platform.",
    implementation_evidence: "Partial integration completed.",
    effective_date: new Date("2024-10-10"),
    review_date: new Date("2025-03-01"),
    comments: "Integration testing in progress."
  },
  {
    id: 3,
    subrequirement_id: 2,
    control_name: "Data Encryption Protocols",
    control_description: "Develop standards for data encryption in transit.",
    control_owner: "Alice Johnson",
    control_status: "Not Started",
    implementation_description: "Encryption protocols have yet to be defined.",
    implementation_evidence: "N/A",
    effective_date: new Date("2025-01-01"),
    review_date: new Date("2025-07-01"),
    comments: "Work to begin Q1 2025."
  },
  {
    id: 4,
    subrequirement_id: 3,
    control_name: "Initial Risk Assessment",
    control_description: "Conduct an initial risk assessment for compliance with ISO 27001.",
    control_owner: "Mike Brown",
    control_status: "Completed",
    implementation_description: "Risk assessment completed and documented.",
    implementation_evidence: "Risk Assessment Report",
    effective_date: new Date("2024-08-15"),
    review_date: new Date("2025-02-15"),
    comments: "Assessment completed without major risks identified."
  },
  {
    id: 5,
    subrequirement_id: 4,
    control_name: "AES-256 Data Encryption",
    control_description: "Implement AES-256 encryption for data at rest.",
    control_owner: "Sarah Davis",
    control_status: "In Progress",
    implementation_description: "Partial encryption for key databases.",
    implementation_evidence: "Database logs showing partial encryption.",
    effective_date: new Date("2024-09-01"),
    review_date: new Date("2025-03-01"),
    comments: "Targeting full encryption by Q2 2025."
  }
];
