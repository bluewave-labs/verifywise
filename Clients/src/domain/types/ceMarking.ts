/**
 * CE Marking Types for EU AI Act Compliance
 */

export enum ConformityStepStatus {
  Completed = "Completed",
  InProgress = "In progress",
  NotStarted = "Not started",
  NotNeeded = "Not needed",
}

export interface ConformityStep {
  id: number;
  step: string;
  description?: string;
  status: ConformityStepStatus;
  owner: string | null;
  dueDate: string | null;
  completedDate?: string | null;
}

export interface CEMarkingData {
  // Classification and scope
  isHighRiskAISystem: boolean;
  roleInProduct: string;
  annexIIICategory: string;
  intendedPurpose: string;

  // EU AI Act completion
  controlsCompleted: number;
  controlsTotal: number;
  assessmentsCompleted: number;
  assessmentsTotal: number;

  // Conformity assessment steps
  conformitySteps: ConformityStep[];
  completedStepsCount: number;
  totalStepsCount: number;

  // Declaration of conformity
  declarationStatus: string;
  signedOn: string | null;
  signatory: string | null;
  declarationDocument: string | null;

  // EU registration
  registrationStatus: string;
  euRegistrationId: string | null;
  registrationDate: string | null;
  euRecordUrl: string | null;

  // Policies and evidence
  policiesLinked: number;
  evidenceLinked: number;
  linkedPolicies?: number[]; // Array of policy IDs
  linkedEvidences?: number[]; // Array of file/evidence IDs

  // Incidents
  totalIncidents: number;
  aiActReportableIncidents: number;
  lastIncident: string | null;
}

// Types for policies and evidences
export interface Policy {
  id: number;
  title: string;
  status: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Evidence {
  id: number;
  filename: string;
  source: string;
  uploaded_time?: string;
  uploader_name?: string;
  uploader_surname?: string;
  project_title?: string;
}
