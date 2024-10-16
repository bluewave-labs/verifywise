export const requirements = [
  {
    id: 1,
    compliance_list_id: 1,
    name: "User Consent",
    description: "Obtain explicit consent from users before processing their personal data.",
    status: "Completed"
  },
  {
    id: 2,
    compliance_list_id: 1,
    name: "Data Encryption",
    description: "Ensure all personal data is encrypted both at rest and in transit.",
    status: "In Progress"
  },
  {
    id: 3,
    compliance_list_id: 2,
    name: "Risk Assessment",
    description: "Conduct regular risk assessments as per ISO 27001 requirements.",
    status: "Not Started"
  },
  {
    id: 4,
    compliance_list_id: 3,
    name: "Patient Data Protection",
    description: "Protect all patient data as per HIPAA regulations.",
    status: "Completed"
  },
  {
    id: 5,
    compliance_list_id: 4,
    name: "Payment Data Encryption",
    description: "Encrypt all payment data to comply with PCI DSS standards.",
    status: "In Progress"
  },
  {
    id: 6,
    compliance_list_id: 5,
    name: "Financial Audit Controls",
    description: "Ensure all financial controls are compliant with the Sarbanes-Oxley Act.",
    status: "Completed"
  }
];
