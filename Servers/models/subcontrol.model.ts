export type Subcontrol = {
  id: number;
  controlId: number;
  title: string;
  description: string;
  orderNo: number;
  status: "Waiting" | "In progress" | "Done";
  approver: string;
  riskReview: "Acceptable risk" | "Residual risk" | "Unacceptable risk";
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  evidenceDescription: string;
  feedbackDescription: string;
  evidenceFiles?: string[];
  feedbackFiles?: string[];
};
