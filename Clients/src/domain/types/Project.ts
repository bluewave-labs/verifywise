// this model will be replaced by the one inside structures/new-mock-data/projects.mock.ts directory

/**
 * Represents the relationship between a project and a framework.
 * Used when a framework is assigned to a specific project.
 */
export type ProjectFramework = {
  /** Unique identifier for this project-framework relationship */
  project_framework_id: number;
  /** Reference to the framework */
  framework_id: number;
  /** Display name of the framework */
  name: string;
};

export type Project = {
  id: number;
  uc_id?: string;
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
  framework: ProjectFramework[];
  monitored_regulations_and_standards: string[];
  geography?: number;
  target_industry?: string;
  description?: string;
  is_organizational?: boolean;
  status?: "Not started" | "In progress" | "Under review" | "Completed" | "Closed" | "On hold" | "Rejected";
  // vendors: string[];

  // statistical fields
  doneSubcontrols?: number;
  totalSubcontrols?: number;
  answeredAssessments?: number;
  totalAssessments?: number;
};
