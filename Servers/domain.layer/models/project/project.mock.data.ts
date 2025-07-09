import { AiRiskClassification } from "../../enums/ai-risk-classification.enum";
import { HighRiskRole } from "../../enums/high-risk-role.enum";
import { IProjectAttributes } from "../../interfaces/i.project";

// Sample mock data for Project
const mockProjects = (user1: number, user2: number): IProjectAttributes[] => {
  return [
    {
      id: 1,
      project_title: "AI Compliance Checker",
      owner: user1,
      start_date: new Date("2023-01-15"),
      ai_risk_classification: AiRiskClassification.HIGH_RISK,
      type_of_high_risk_role: HighRiskRole.DEPLOYER,
      goal: "To ensure compliance with AI governance standards",
      last_updated: new Date("2024-10-30"),
      last_updated_by: user1,
    },
    {
      id: 2,
      project_title: "Data Analyzer",
      owner: user1,
      start_date: new Date("2023-03-22"),
      ai_risk_classification: AiRiskClassification.LIMITED_RISK,
      type_of_high_risk_role: HighRiskRole.PROVIDER,
      goal: "Analyze and optimize dataset usage",
      last_updated: new Date("2024-09-12"),
      last_updated_by: user2,
    },
  ];
};

// Export the mock data for use in other files
export default mockProjects;
