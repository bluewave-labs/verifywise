import { SubClauseStructISO } from "../../../../models/ISO-42001/subClauseStructISO.model";

export const Operation: SubClauseStructISO[] = [
  {
    title: "Operational planning and control",
    order_no: 1,
    summary: "Plan, implement, and control processes to meet requirements, implement actions from Clause 6, manage changes, and control outsourced processes.",
    questions: [
      "How are operational processes (related to AI development/deployment/use) planned and controlled?",
      "How are changes to these processes or AI systems managed?",
      "How do we control processes outsourced to third parties that affect the AIMS?"
    ],
    evidence_examples: [
      "Standard Operating Procedures (SOPs) for AI lifecycle stages",
      "Change management procedures and records",
      "Supplier contracts and oversight procedures"
    ]
  },
  {
    title: "AI risk assessment (Operational)",
    order_no: 2,
    summary: "Perform AI risk assessments operationally (at planned intervals or upon significant changes).",
    questions: [
      "How often are AI risk assessments reviewed and updated?",
      "What triggers an ad-hoc risk assessment (e.g., new system, major change, incident)?"
    ],
    evidence_examples: [
      "Schedule/plan for risk assessment reviews",
      "Updated risk assessment reports"
    ]
  },
  {
    title: "AI risk treatment (Operational)",
    order_no: 3,
    summary: "Implement the AI risk treatment plan.",
    questions: [
      "Are the controls defined in the risk treatment plan actually implemented?",
      "Is there evidence of control operation?"
    ],
    evidence_examples: [
      "Records of control implementation (configuration settings, logs, procedure execution records)",
      "Completed checklists",
      "Training records related to specific controls"
    ]
  },
  {
    title: "AI System Lifecycle",
    order_no: 4,
    summary: "Define and implement processes for managing the entire AI system lifecycle consistent with policy, objectives, and impact assessments.",
    questions: [
      "Do we have documented processes for each stage (requirements, design, data handling, model building, V&V, deployment, operation, monitoring, retirement)?",
      "How are AI principles (fairness, transparency etc.) embedded in these processes?",
      "How is documentation managed throughout the lifecycle?",
      "How are results from impact assessments considered during the lifecycle?"
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
      "Retirement plans"
    ]
  },
  {
    title: "Third-party relationships",
    order_no: 5,
    summary: "Manage risks associated with third-party suppliers/partners involved in the AI lifecycle.",
    questions: [
      "How do we identify and assess risks related to third-party AI components or services?",
      "Are AI-specific requirements included in contracts?",
      "How do we monitor third-party performance and compliance?"
    ],
    evidence_examples: [
      "Third-party risk management procedure",
      "Supplier assessment questionnaires/reports",
      "Contracts with AI clauses",
      "Supplier audit reports",
      "Service Level Agreements (SLAs)"
    ]
  }
]