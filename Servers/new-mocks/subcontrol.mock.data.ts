/**
 * values for riskReview: Acceptable risk | Residual risk | Unacceptable risk
 * values for status: Waiting | In progress | Done
 */

type Subcontrol = {
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
  attachment: string;
  feedback: string;
};

export const subcontrols: Subcontrol[] = [
  {
    id: 1,
    controlId: 1,
    status: "In progress",
    approver: "John Doe",
    riskReview: "Acceptable risk",
    owner: "Bob Johnson",
    reviewer: "Alice Williams",
    dueDate: new Date("2023-12-31"),
    implementationDetails: "Implement new feature",
    evidence: "evidence1.pdf",
    attachment: "attachment1.docx",
    feedback: "Great work so far.",
  },
  {
    id: 2,
    controlId: 2,
    status: "Waiting",
    approver: "Sarah Lee",
    riskReview: "Residual risk",
    owner: "Emily Davis",
    reviewer: "David Wilson",
    dueDate: new Date("2024-06-30"),
    implementationDetails: "Update existing functionality",
    evidence: "evidence2.png",
    attachment: "attachment2.xlsx",
    feedback: "Please address the feedback provided.",
  },
  {
    id: 3,
    controlId: 3,
    status: "Done",
    approver: "Michael Brown",
    riskReview: "Unacceptable risk",
    owner: "Chris Green",
    reviewer: "Nancy White",
    dueDate: new Date("2023-11-15"),
    implementationDetails: "Conduct security audit",
    evidence: "evidence3.doc",
    attachment: "attachment3.pdf",
    feedback: "Audit completed successfully.",
  },
  {
    id: 4,
    controlId: 4,
    status: "In progress",
    approver: "Jessica Black",
    riskReview: "Acceptable risk",
    owner: "Tom Harris",
    reviewer: "Laura King",
    dueDate: new Date("2024-01-20"),
    implementationDetails: "Develop new module",
    evidence: "evidence4.jpg",
    attachment: "attachment4.pptx",
    feedback: "Module development is on track.",
  },
];
