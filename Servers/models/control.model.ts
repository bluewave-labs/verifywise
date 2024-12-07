export type Control = {
  id: number;
  projectId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  controlGroup: string;
};
