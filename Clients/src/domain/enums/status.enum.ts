export enum Status {
  Active = "active",
  Inactive = "inactive",
  Canceled = "canceled",
}

export enum TrainingStatus {
  Planned = "Planned",
  InProgress = "In Progress",
  Completed = "Completed",
}

export enum ReviewStatus {
  NotStarted = "Not started",
  InReview = "In review",
  Reviewed = "Reviewed",
  RequiresFollowUp = "Requires follow-up",
}

export enum DataSensitivity {
  None = "None",
  InternalOnly = "Internal Only", 
  PII = "Personally Identifiable Information (PII)",
  FinancialData = "Financial Data",
  HealthData = "Health Data (e.g. HIPAA)",
  ModelWeights = "Model Weights or AI Assets",
  OtherSensitive = "Other Sensitive Data"
}

export enum BusinessCriticality {
  Low = "Low (Vendor supports non-core functions)",
  Medium = "Medium (Affects operations but is replaceable)",
  High = "High (Critical to core services or products)"
}

export enum PastIssues {
  None = "None",
  MinorIncident = "Minor Incident (e.g. small delay, minor bug)",
  MajorIncident = "Major Incident (e.g. data breach, legal issue)"
}

export enum RegulatoryExposure {
  None = "None",
  GDPR = "GDPR (EU)",
  HIPAA = "HIPAA (US)",
  SOC2 = "SOC 2",
  ISO27001 = "ISO 27001",
  EUAIAct = "EU AI Act",
  CCPA = "CCPA (California)",
  Other = "Other"
}
