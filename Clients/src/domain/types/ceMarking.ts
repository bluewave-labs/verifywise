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
  linkedIncidents?: number[]; // Array of incident IDs
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

export interface Incident {
  id: number;
  incident_id?: string;
  ai_project: string;
  type: string;
  severity: string;
  status: string;
  occurred_date: string;
  date_detected: string;
  reporter: string;
  description: string;
  categories_of_harm?: string[];
  approval_status: string;
  created_at?: string;
  updated_at?: string;
}

// Update payload interfaces for API calls
export interface ConformityStepUpdate {
  id: number;
  description?: string;
  status?: string;
  owner?: string;
  dueDate?: string | null;
  completedDate?: string | null;
}

export interface ConformityStepsUpdatePayload {
  conformitySteps: ConformityStepUpdate[];
}

export interface LinkedResourcesUpdatePayload {
  linkedPolicies?: number[];
  policiesLinked?: number;
  linkedEvidences?: number[];
  evidenceLinked?: number;
  linkedIncidents?: number[];
  totalIncidents?: number;
}
