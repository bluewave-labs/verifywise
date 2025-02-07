export type Subcontrol = {
  id: number;
  controlId: number;
  status: "Waiting" | "In progress" | "Done";
  approver: string;
  riskReview: "Acceptable risk" | "Residual risk" | "Unacceptable risk";
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  evidence: string;
  feedback: string;
  evidenceFiles?: string[];
  feedbackFiles?: string[];
};
