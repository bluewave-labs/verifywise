// projectMockData.ts

// Define the type for Project based on the updated table structure
type Project = {
  id: number;
  project_title: string;
  owner: string;
  users: number[]; // List of user IDs as integers
  start_date: Date;
  ai_risk_classification: "high risk" | "limited risk" | "minimal risk";
  type_of_high_risk_role:
    | "deployer"
    | "provider"
    | "distributor"
    | "importer"
    | "product manufacturer"
    | "authorized representative";
  goal: string;
  last_updated: Date;
  last_updated_by: string;
};

// Sample mock data for Project
const mockProjects: Project[] = [
  {
    id: 1,
    project_title: "AI Compliance Checker",
    owner: "Alice",
    users: [101, 102, 103], // User IDs as integers
    start_date: new Date("2023-01-15"),
    ai_risk_classification: "high risk",
    type_of_high_risk_role: "deployer",
    goal: "To ensure compliance with AI governance standards",
    last_updated: new Date("2024-10-30"),
    last_updated_by: "Alice",
  },
  {
    id: 2,
    project_title: "Data Analyzer",
    owner: "Bob",
    users: [104, 105],
    start_date: new Date("2023-03-22"),
    ai_risk_classification: "limited risk",
    type_of_high_risk_role: "provider",
    goal: "Analyze and optimize dataset usage",
    last_updated: new Date("2024-09-12"),
    last_updated_by: "Bob",
  },
  {
    id: 3,
    project_title: "Risk Assessment Tool",
    owner: "Charlie",
    users: [106, 107, 108, 109],
    start_date: new Date("2022-11-07"),
    ai_risk_classification: "minimal risk",
    type_of_high_risk_role: "distributor",
    goal: "Provide insights into potential AI risks",
    last_updated: new Date("2024-11-01"),
    last_updated_by: "Charlie",
  },
];

// Export the mock data for use in other files
export default mockProjects;
