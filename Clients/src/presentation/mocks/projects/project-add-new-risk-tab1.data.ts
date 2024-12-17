// Enum for dropdown options
enum ProjectName {
  AIChatbot = "AI Chatbot",
  AIMarketing = "AI Marketing",
  AIHRApplication = "AI HR Application",
}

enum AILifecyclePhase {
  Planning = "Planning",
  Development = "Development",
  Testing = "Testing",
  Deployment = "Deployment",
  Monitoring = "Monitoring",
}

enum RiskLikelihood {
  Rare = "Rare",
  Unlikely = "Unlikely",
  Possible = "Possible",
  Likely = "Likely",
  AlmostCertain = "Almost Certain",
}

enum RiskSeverity {
  Insignificant = "Insignificant",
  Minor = "Minor",
  Moderate = "Moderate",
  Major = "Major",
  Critical = "Critical",
}

enum RiskLevel {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  VeryHigh = "Very High",
  Extreme = "Extreme",
}

// Interface for the form data
interface AddNewRiskForm {
  projectName: ProjectName;
  actionOwner: string; // Assuming this is a free text field to input names
  aiLifecyclePhase: AILifecyclePhase;
  riskDescription: string;
  riskCategory: string; // Assuming this is a free text field or another enum if categories are predefined
  potentialImpact: string;
  assessmentMapping: string; // Assuming this is a free text field
  controlsMapping: string; // Assuming this is a free text field
  likelihood: RiskLikelihood;
  riskSeverity: RiskSeverity;
  riskLevel: RiskLevel; // Auto-calculated based on likelihood and severity
  reviewNotes: string;
}

// Example usage:
export const newRisk: AddNewRiskForm = {
  projectName: ProjectName.AIChatbot,
  actionOwner: "John Doe", // One of the 5 different names
  aiLifecyclePhase: AILifecyclePhase.Development,
  riskDescription: "Potential data breach during testing phase",
  riskCategory: "Security",
  potentialImpact: "Exposure of sensitive user data",
  assessmentMapping: "Security audit required",
  controlsMapping: "Implement encrypted test data",
  likelihood: RiskLikelihood.Unlikely,
  riskSeverity: RiskSeverity.Major,
  riskLevel: RiskLevel.High, // This would be auto-calculated in the actual implementation
  reviewNotes: "Discuss with security team for additional safeguards",
};
