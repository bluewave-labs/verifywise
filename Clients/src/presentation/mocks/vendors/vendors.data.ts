type Vendor = {
  id: number;
  name: string;
  type: string;
  description: string; // combines projectConnected and servicesProvided
  website: string;
  contact_person: string;
  assignee: string;
  status: string;
  review_result: string;
  reviewer: string;
  review_date: string;
  review_status: string;
  risk_status: string;
};

const vendorList: Vendor[] = [
  {
    id: 1,
    name: "Apex",
    type: "Contractor",
    description:
      "Project: Chatbot AI, Services: NLP model development and maintenance",
    website: "https://apex-ai.com",
    contact_person: "John McAllen",
    assignee: "John McAllen",
    status: "Active",
    review_result: "Positive, needs minor improvements",
    reviewer: "George Michael",
    review_date: "12 January 2024",
    review_status: "Under Review",
    risk_status: "High",
  },
  {
    id: 2,
    name: "Nexus",
    type: "Supplier",
    description:
      "Project: Marketing AI, Services: Data sourcing and validation for AI training",
    website: "https://nexusdata.com",
    contact_person: "Jessica Parker",
    assignee: "Jessica Parker",
    status: "Active",
    review_result: "Satisfactory",
    reviewer: "Sarah Lee",
    review_date: "12 January 2024",
    review_status: "Completed",
    risk_status: "Moderate",
  },
  {
    id: 3,
    name: "Skyline Solutions",
    type: "Service Provider",
    description:
      "Project: Compliance AI, Services: Cloud hosting and computing services",
    website: "https://skyline-solutions.com",
    contact_person: "Michael Johnson",
    assignee: "Michael Johnson",
    status: "Inactive",
    review_result: "Needs significant improvement",
    reviewer: "George Michael",
    review_date: "15 January 2024",
    review_status: "Failed",
    risk_status: "Low",
  },
];

export { vendorList };
