// this model will be replaced by the one inside structures/new-mock-data/projects.mock.ts directory

export type Project = {
  id: number;
  project_title: string;
  owner: number;
  members: string[];
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
  last_updated_by: number;
  framework: {
    project_framework_id: number;
    framework_id: number;
    name: string;
  }[];
  monitored_regulations_and_standards: string[];
  geography?: number;
  is_organizational?: boolean;
  status?: "Not started" | "In progress" | "Under review" | "Completed" | "Closed" | "On hold" | "Rejected";
  // vendors: string[];

  // statistical fields
  doneSubcontrols?: number;
  totalSubcontrols?: number;
  answeredAssessments?: number;
  totalAssessments?: number;
};
