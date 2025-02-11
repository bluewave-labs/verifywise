// This is the new User model and will be replaced by the old User type.
type Project = {
  id?: number;
  project_title: string;
  owner: number;
  members: number[];
  start_date: Date;
  ai_risk_classification: "High risk" | "Limited risk" | "Minimal risk";
  type_of_high_risk_role:
    | "Deployer"
    | "Provider"
    | "Distributor"
    | "Importer"
    | "Product"
    | "manufacturer"
    | "Authorized"
    | "representative";
  goal: string;
  last_updated: Date;
  last_updated_by: number;
  vendors?: number[];
};

// owner will be the id of the user that own's this, coming from the frontend
// members is the list of ids for members of the team. When project is created, only there is one member, meaning that the array has only one element in it.
// last_updated will be set as start_date the first time project is created. But, in every update, it is auto generated in backend
// vendors list will be holding ids of vendor, and when project is created, it will be an empty list
export const mockprojects: Project[] = [
  {
    project_title: "AI Compliance Checker",
    owner: 1234, // Read the descriptions on how to get value for this field above
    members: [1, 0, 0, 0], // Read the descriptions on how to get value for this field above
    start_date: new Date("2025-01-01"),
    ai_risk_classification: "High risk",
    type_of_high_risk_role: "Deployer",
    goal: "To ensure compliance with AI governance standards",
    last_updated: new Date("2025-01-01"), // Read the descriptions on how to get value for this field above
    last_updated_by: 1,
    vendors: [], // Read the descriptions on how to get value for this field above
  },
  {
    project_title: "Data Analyzer",
    owner: 1234,
    members: [1, 0, 0, 0],
    start_date: new Date("2025-01-01"),
    ai_risk_classification: "Limited risk",
    type_of_high_risk_role: "Provider",
    goal: "Analyze and optimize dataset usage",
    last_updated: new Date("2025-01-01"),
    last_updated_by: 1,
    vendors: [],
  },
];
