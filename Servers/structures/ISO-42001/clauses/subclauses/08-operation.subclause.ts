import { SubClauseISO } from "../../../../domain.layer/frameworks/ISO-42001/subClauseISO.model";
import { SubClauseStructISO } from "../../../../domain.layer/frameworks/ISO-42001/subClauseStructISO.model";

export const Operation: Partial<SubClauseStructISO & SubClauseISO>[] = [
  {
    title: "Operational planning and control",
    order_no: 1,
    summary:
      "Plan, implement, and control processes to meet requirements, implement actions from Clause 6, manage changes, and control outsourced processes.",
    questions: [
      "How are operational processes (related to AI development/deployment/use) planned and controlled?",
      "How are changes to these processes or AI systems managed?",
      "How do we control processes outsourced to third parties that affect the AIMS?",
    ],
    evidence_examples: [
      "Standard Operating Procedures (SOPs) for AI lifecycle stages",
      "Change management procedures and records",
      "Supplier contracts and oversight procedures",
    ],
    implementation_description:
      "AI operational processes are governed by SOPs that define planning, execution, and change control mechanisms. Outsourced activities are covered by SLAs.",
    auditor_feedback:
      "Comprehensive procedures in place. Suggest adding traceability from change requests to impact assessments for full alignment.",
  },
  {
    title: "AI risk assessment (Operational)",
    order_no: 2,
    summary:
      "Perform AI risk assessments operationally (at planned intervals or upon significant changes).",
    questions: [
      "How often are AI risk assessments reviewed and updated?",
      "What triggers an ad-hoc risk assessment (e.g., new system, major change, incident)?",
    ],
    evidence_examples: [
      "Schedule/plan for risk assessment reviews",
      "Updated risk assessment reports",
    ],
    implementation_description:
      "Risk assessments are reviewed quarterly or upon major system changes. A defined trigger protocol exists for unscheduled reviews.",
    auditor_feedback:
      "Assessment frequency is appropriate. Consider including minor incident trends as triggers for ad-hoc assessments.",
  },
  {
    title: "AI risk treatment (Operational)",
    order_no: 3,
    summary: "Implement the AI risk treatment plan.",
    questions: [
      "Are the controls defined in the risk treatment plan actually implemented?",
      "Is there evidence of control operation?",
    ],
    evidence_examples: [
      "Records of control implementation (configuration settings, logs, procedure execution records)",
      "Completed checklists",
      "Training records related to specific controls",
    ],
    implementation_description:
      "Risk treatment plans are executed by control owners. Implementation is tracked using checklists and control operation logs.",
    auditor_feedback:
      "Implementation is traceable. Recommend adding automated control verification for higher-risk systems.",
  },
  {
    title: "AI System Lifecycle",
    order_no: 4,
    summary:
      "Define and implement processes for managing the entire AI system lifecycle consistent with policy, objectives, and impact assessments.",
    questions: [
      "Do we have documented processes for each stage (requirements, design, data handling, model building, V&V, deployment, operation, monitoring, retirement)?",
      "How are AI principles (fairness, transparency etc.) embedded in these processes?",
      "How is documentation managed throughout the lifecycle?",
      "How are results from impact assessments considered during the lifecycle?",
    ],
    evidence_examples: [
      "Documented AI system lifecycle process description",
      "Project plans",
      "Requirements specifications",
      "Design documents",
      "Data processing procedures",
      "Model training logs",
      "Verification & Validation reports",
      "Deployment procedures",
      "Monitoring procedures and logs",
      "Retirement plans",
    ],
    implementation_description:
      "AI lifecycle management spans from requirements gathering to retirement, with documented checkpoints at each phase. Ethical principles are embedded throughout.",
    auditor_feedback:
      "Lifecycle approach is well-structured. Suggest more emphasis on bias mitigation during model training and validation.",
  },
  {
    title: "Third-party relationships",
    order_no: 5,
    summary:
      "Manage risks associated with third-party suppliers/partners involved in the AI lifecycle.",
    questions: [
      "How do we identify and assess risks related to third-party AI components or services?",
      "Are AI-specific requirements included in contracts?",
      "How do we monitor third-party performance and compliance?",
    ],
    evidence_examples: [
      "Third-party risk management procedure",
      "Supplier assessment questionnaires/reports",
      "Contracts with AI clauses",
      "Supplier audit reports",
      "Service Level Agreements (SLAs)",
    ],
    implementation_description:
      "Third-party risks are assessed during onboarding and annually thereafter. Contracts include AI-specific obligations and audit clauses.",
    auditor_feedback:
      "Good supplier oversight. Recommend periodic spot checks to ensure compliance with contractual AI clauses.",
  },
];
