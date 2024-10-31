type Vendor = {
    name: string;
    type: string;
    assignee: string;
    status: string;
    risk: string;
    reviewDate: string;
  };
  
  type VendorDetail = {
    vendorName: string;
    projectConnected: string;
    servicesProvided: string;
    website: string;
    contactPerson: string;
    reviewResult: string;
    reviewStatus: string;
    reviewer: string;
    riskStatus: string;
    reviewDate: string;
  };
  
  type VendorRisk = {
    riskDescription: string;
    impactDescription: string;
    projectName: string;
    probability: number;
    impact: string;
    actionOwner: string;
    riskSeverity: string;
    likelihood: string;
    riskLevel: string;
    actionPlan: string;
  };
  
  const vendorList: Vendor[] = [
    {
      name: "Apex",
      type: "Contractor",
      assignee: "John McAllen",
      status: "Active",
      risk: "High",
      reviewDate: "12 January 2024",
    },
    {
      name: "Nexus",
      type: "Supplier",
      assignee: "Jessica Parker",
      status: "Active",
      risk: "Moderate",
      reviewDate: "12 January 2024",
    },
    {
      name: "Skyline Solutions",
      type: "Service Provider",
      assignee: "Michael Johnson",
      status: "Inactive",
      risk: "Low",
      reviewDate: "15 January 2024",
    },
  ];
  
  const vendorDetails: VendorDetail[] = [
    {
      vendorName: "Apex",
      projectConnected: "Chatbot AI",
      servicesProvided: "Natural Language Processing (NLP) model development and maintenance",
      website: "https://apex-ai.com",
      contactPerson: "John McAllen",
      reviewResult: "Positive, needs minor improvements",
      reviewStatus: "Under Review",
      reviewer: "George Michael",
      riskStatus: "High",
      reviewDate: "12 January 2024",
    },
    {
      vendorName: "Nexus",
      projectConnected: "Marketing AI",
      servicesProvided: "Data sourcing and validation for AI training",
      website: "https://nexusdata.com",
      contactPerson: "Jessica Parker",
      reviewResult: "Satisfactory",
      reviewStatus: "Completed",
      reviewer: "Sarah Lee",
      riskStatus: "Moderate",
      reviewDate: "12 January 2024",
    },
    {
      vendorName: "Skyline Solutions",
      projectConnected: "Compliance AI",
      servicesProvided: "Cloud hosting and computing services",
      website: "https://skyline-solutions.com",
      contactPerson: "Michael Johnson",
      reviewResult: "Needs significant improvement",
      reviewStatus: "Failed",
      reviewer: "George Michael",
      riskStatus: "Low",
      reviewDate: "15 January 2024",
    },
  ];
  
  const vendorRisks: VendorRisk[] = [
    {
      riskDescription: "Inconsistent model performance during peak loads",
      impactDescription: "Potential delay in chatbot response times",
      projectName: "Chatbot AI",
      probability: 4,
      impact: "High",
      actionOwner: "John McAllen",
      riskSeverity: "Critical",
      likelihood: "Probable",
      riskLevel: "High",
      actionPlan: "Increase server capacity during peak hours to balance the load",
    },
    {
      riskDescription: "Data sourcing biases leading to inaccurate model predictions",
      impactDescription: "Negative impact on customer targeting in marketing campaigns",
      projectName: "Marketing AI",
      probability: 3,
      impact: "Moderate",
      actionOwner: "Jessica Parker",
      riskSeverity: "Major",
      likelihood: "Possible",
      riskLevel: "Moderate",
      actionPlan: "Improve data quality checks and introduce more diverse datasets",
    },
    {
      riskDescription: "Server downtime causing interruptions in AI compliance checks",
      impactDescription: "Delays in regulatory compliance reports",
      projectName: "Compliance AI",
      probability: 2,
      impact: "Low",
      actionOwner: "Michael Johnson",
      riskSeverity: "Minor",
      likelihood: "Unlikely",
      riskLevel: "Low",
      actionPlan: "Schedule routine server maintenance and backups to minimize downtime",
    },
  ];
  
  export { vendorList, vendorDetails, vendorRisks };