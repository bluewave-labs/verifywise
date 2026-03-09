export interface Iso42001Control {
  annexRef: string;
  categoryCode: string;
  categoryName: string;
  title: string;
  description: string;
  suggestedEvidence: string[];
}

export const ISO_42001_CONTROLS: Iso42001Control[] = [
  // ─── A.2 AI Policies ────────────────────────────────────────────────────────
  {
    annexRef: "A.2.1",
    categoryCode: "A.2",
    categoryName: "AI policies",
    title: "AI policy",
    description:
      "The organization shall define and approve a high-level AI policy that sets the direction for the responsible development, deployment, and use of AI systems. The policy shall be communicated to all relevant personnel and reviewed at planned intervals.",
    suggestedEvidence: [
      "Approved AI policy document",
      "Communication records showing distribution to staff",
      "Policy review meeting minutes",
    ],
  },
  {
    annexRef: "A.2.2",
    categoryCode: "A.2",
    categoryName: "AI policies",
    title: "AI governance policy",
    description:
      "The organization shall establish a governance policy that defines the decision-making structure, accountability mechanisms, and oversight processes for AI systems. This policy shall address the full lifecycle of AI systems from conception through retirement.",
    suggestedEvidence: [
      "AI governance policy document",
      "Governance structure diagram or RACI matrix",
      "Records of governance committee meetings",
    ],
  },
  {
    annexRef: "A.2.3",
    categoryCode: "A.2",
    categoryName: "AI policies",
    title: "Roles and responsibilities",
    description:
      "The organization shall define and document AI-related roles and responsibilities across all relevant functions. Responsibilities shall cover development, deployment, monitoring, and incident response for AI systems.",
    suggestedEvidence: [
      "Documented roles and responsibilities matrix",
      "Job descriptions with AI-specific duties",
      "Organizational chart showing AI governance roles",
    ],
  },
  {
    annexRef: "A.2.4",
    categoryCode: "A.2",
    categoryName: "AI policies",
    title: "AI system acceptance criteria",
    description:
      "The organization shall establish acceptance criteria for AI systems before they are deployed to production. Criteria shall address performance thresholds, fairness metrics, safety requirements, and compliance checks that must be satisfied.",
    suggestedEvidence: [
      "AI system acceptance criteria document",
      "Acceptance test reports and sign-off records",
      "Gate review checklists for AI deployments",
    ],
  },

  // ─── A.3 Internal Organization ──────────────────────────────────────────────
  {
    annexRef: "A.3.1",
    categoryCode: "A.3",
    categoryName: "Internal organization",
    title: "AI roles",
    description:
      "The organization shall assign specific AI-related roles such as AI system owner, AI ethics lead, and data steward. These roles shall have clearly defined authority and accountability within the AI management system.",
    suggestedEvidence: [
      "Role assignment records or appointment letters",
      "AI RACI matrix",
      "Evidence of role-holder acknowledgment",
    ],
  },
  {
    annexRef: "A.3.2",
    categoryCode: "A.3",
    categoryName: "Internal organization",
    title: "AI competence requirements",
    description:
      "The organization shall determine the competence requirements for personnel involved in AI system development, deployment, and oversight. Training programs shall be established to address identified gaps and maintain competence over time.",
    suggestedEvidence: [
      "Competence framework or skills matrix for AI roles",
      "Training records and completion certificates",
      "Competence assessment results",
    ],
  },
  {
    annexRef: "A.3.3",
    categoryCode: "A.3",
    categoryName: "Internal organization",
    title: "Communication of AI responsibilities",
    description:
      "The organization shall ensure that AI-related responsibilities are communicated effectively to all relevant parties, including internal teams, contractors, and third-party partners. Communication shall include expectations for ethical AI use and compliance.",
    suggestedEvidence: [
      "Internal communication records (emails, intranet posts)",
      "Onboarding materials covering AI responsibilities",
      "Signed acknowledgment forms from staff and partners",
    ],
  },

  // ─── A.4 Resources for AI Systems ──────────────────────────────────────────
  {
    annexRef: "A.4.1",
    categoryCode: "A.4",
    categoryName: "Resources for AI systems",
    title: "AI system resources",
    description:
      "The organization shall determine and provide the resources needed for the development, operation, and maintenance of AI systems. This includes personnel, tools, infrastructure, and budget allocations.",
    suggestedEvidence: [
      "Resource allocation plans or budgets for AI initiatives",
      "Staffing plans for AI teams",
      "Procurement records for AI tools and infrastructure",
    ],
  },
  {
    annexRef: "A.4.2",
    categoryCode: "A.4",
    categoryName: "Resources for AI systems",
    title: "Data management",
    description:
      "The organization shall implement data management processes that ensure the quality, integrity, and appropriateness of data used in AI systems. This includes data collection, storage, labeling, and lifecycle management procedures.",
    suggestedEvidence: [
      "Data management policy and procedures",
      "Data quality assessment reports",
      "Data inventory or catalog",
      "Data retention and disposal records",
    ],
  },
  {
    annexRef: "A.4.3",
    categoryCode: "A.4",
    categoryName: "Resources for AI systems",
    title: "Computing resources",
    description:
      "The organization shall provision adequate computing resources including hardware, cloud services, and software environments to support the training, testing, and deployment of AI systems in a reliable and scalable manner.",
    suggestedEvidence: [
      "Infrastructure capacity planning documents",
      "Cloud service agreements and usage reports",
      "Computing resource inventory",
    ],
  },
  {
    annexRef: "A.4.4",
    categoryCode: "A.4",
    categoryName: "Resources for AI systems",
    title: "Communication about AI resources",
    description:
      "The organization shall establish communication channels to keep stakeholders informed about the availability, limitations, and changes to AI resources. This includes both technical resources and human expertise.",
    suggestedEvidence: [
      "Communication plans for AI resource updates",
      "Stakeholder notification records",
      "Resource status dashboards or reports",
    ],
  },
  {
    annexRef: "A.4.5",
    categoryCode: "A.4",
    categoryName: "Resources for AI systems",
    title: "Availability of AI resources",
    description:
      "The organization shall ensure the availability and continuity of critical AI system resources. Contingency plans shall address resource failures, capacity constraints, and disaster recovery scenarios for AI operations.",
    suggestedEvidence: [
      "Business continuity plans covering AI systems",
      "Redundancy and failover configurations",
      "Availability monitoring records and SLA reports",
    ],
  },

  // ─── A.5 Assessing Impacts of AI Systems ──────────────────────────────────
  {
    annexRef: "A.5.1",
    categoryCode: "A.5",
    categoryName: "Assessing impacts of AI systems",
    title: "AI impact assessment methodology",
    description:
      "The organization shall define a methodology for assessing the potential impacts of AI systems on individuals, groups, and society. The methodology shall cover ethical, legal, social, and environmental dimensions.",
    suggestedEvidence: [
      "Documented impact assessment methodology",
      "Impact assessment templates and scoring criteria",
      "Records of methodology review and updates",
    ],
  },
  {
    annexRef: "A.5.2",
    categoryCode: "A.5",
    categoryName: "Assessing impacts of AI systems",
    title: "AI impact assessment",
    description:
      "The organization shall conduct impact assessments for each AI system before deployment and at regular intervals. Assessments shall evaluate risks to fundamental rights, safety, fairness, and potential for discrimination or harm.",
    suggestedEvidence: [
      "Completed impact assessment reports for each AI system",
      "Stakeholder consultation records",
      "Risk mitigation actions arising from assessments",
    ],
  },
  {
    annexRef: "A.5.3",
    categoryCode: "A.5",
    categoryName: "Assessing impacts of AI systems",
    title: "AI impact assessment documentation",
    description:
      "The organization shall maintain comprehensive documentation of all AI impact assessments, including the scope, findings, decisions made, and actions taken. Documentation shall be retained as evidence of due diligence.",
    suggestedEvidence: [
      "Archived impact assessment documents with version control",
      "Decision logs and action item trackers",
      "Sign-off records from responsible parties",
    ],
  },
  {
    annexRef: "A.5.4",
    categoryCode: "A.5",
    categoryName: "Assessing impacts of AI systems",
    title: "AI impact assessment review",
    description:
      "The organization shall periodically review and update AI impact assessments to reflect changes in AI system behavior, operating context, regulations, or stakeholder expectations. Reviews shall trigger reassessment when material changes occur.",
    suggestedEvidence: [
      "Review schedule and records of completed reviews",
      "Updated impact assessment reports",
      "Change logs documenting triggers for reassessment",
    ],
  },

  // ─── A.6 AI System Lifecycle ───────────────────────────────────────────────
  {
    annexRef: "A.6.1",
    categoryCode: "A.6",
    categoryName: "AI system lifecycle",
    title: "AI system lifecycle management",
    description:
      "The organization shall establish processes covering the entire AI system lifecycle including planning, design, development, testing, deployment, operation, and retirement. Each stage shall have defined entry and exit criteria.",
    suggestedEvidence: [
      "AI system lifecycle management procedure",
      "Stage gate criteria and approval records",
      "Lifecycle process diagrams",
    ],
  },
  {
    annexRef: "A.6.2",
    categoryCode: "A.6",
    categoryName: "AI system lifecycle",
    title: "Data for AI system development",
    description:
      "The organization shall ensure that data used during AI system development is suitable, representative, and appropriately validated. Data provenance, licensing, and bias assessments shall be documented for all training and testing datasets.",
    suggestedEvidence: [
      "Dataset documentation cards or datasheets",
      "Data provenance and licensing records",
      "Bias and representativeness analysis reports",
    ],
  },
  {
    annexRef: "A.6.3",
    categoryCode: "A.6",
    categoryName: "AI system lifecycle",
    title: "AI system testing",
    description:
      "The organization shall implement a testing strategy for AI systems that includes functional testing, performance testing, fairness testing, and adversarial testing. Test results shall be documented and used to inform deployment decisions.",
    suggestedEvidence: [
      "AI testing strategy document",
      "Test plans and test case results",
      "Fairness and adversarial testing reports",
      "Test sign-off and deployment approval records",
    ],
  },
  {
    annexRef: "A.6.4",
    categoryCode: "A.6",
    categoryName: "AI system lifecycle",
    title: "AI system operation",
    description:
      "The organization shall define operational procedures for AI systems in production, including performance baselines, alert thresholds, escalation paths, and human oversight mechanisms. Procedures shall address both normal operations and exception handling.",
    suggestedEvidence: [
      "AI system operational runbooks",
      "Performance baseline documentation",
      "Escalation and incident response procedures",
    ],
  },
  {
    annexRef: "A.6.5",
    categoryCode: "A.6",
    categoryName: "AI system lifecycle",
    title: "AI system monitoring",
    description:
      "The organization shall continuously monitor AI systems in production for performance degradation, data drift, fairness drift, and anomalous behavior. Monitoring results shall trigger review and corrective action when thresholds are breached.",
    suggestedEvidence: [
      "Monitoring dashboards and alert configurations",
      "Drift detection reports",
      "Corrective action records triggered by monitoring",
    ],
  },
  {
    annexRef: "A.6.6",
    categoryCode: "A.6",
    categoryName: "AI system lifecycle",
    title: "AI system retirement",
    description:
      "The organization shall establish procedures for the orderly retirement of AI systems, including data archival, stakeholder notification, dependency analysis, and transition planning. Retirement decisions shall be documented and approved.",
    suggestedEvidence: [
      "AI system retirement procedure",
      "Retirement decision records and approvals",
      "Data archival and disposal certificates",
    ],
  },

  // ─── A.7 Data for AI Systems ───────────────────────────────────────────────
  {
    annexRef: "A.7.1",
    categoryCode: "A.7",
    categoryName: "Data for AI systems",
    title: "Data acquisition",
    description:
      "The organization shall establish procedures for acquiring data used in AI systems, ensuring that data is obtained lawfully, ethically, and with appropriate consent. Data sources shall be vetted and documented.",
    suggestedEvidence: [
      "Data acquisition procedures",
      "Data source vetting records",
      "Consent and licensing documentation",
    ],
  },
  {
    annexRef: "A.7.2",
    categoryCode: "A.7",
    categoryName: "Data for AI systems",
    title: "Data quality",
    description:
      "The organization shall implement data quality controls for AI systems covering accuracy, completeness, consistency, and timeliness. Quality metrics shall be defined, measured, and reported for all critical datasets.",
    suggestedEvidence: [
      "Data quality policy and standards",
      "Data quality measurement reports",
      "Data cleansing and remediation records",
    ],
  },
  {
    annexRef: "A.7.3",
    categoryCode: "A.7",
    categoryName: "Data for AI systems",
    title: "Data labeling",
    description:
      "The organization shall establish procedures for data labeling that ensure consistency, accuracy, and traceability. Labeling guidelines, inter-annotator agreement metrics, and quality review processes shall be documented.",
    suggestedEvidence: [
      "Data labeling guidelines and procedures",
      "Inter-annotator agreement reports",
      "Labeling quality review records",
      "Annotator training materials",
    ],
  },
  {
    annexRef: "A.7.4",
    categoryCode: "A.7",
    categoryName: "Data for AI systems",
    title: "Data privacy",
    description:
      "The organization shall implement privacy protections for data used in AI systems, including anonymization, pseudonymization, access controls, and compliance with applicable data protection regulations. Privacy impact assessments shall be conducted.",
    suggestedEvidence: [
      "Privacy impact assessment reports",
      "Data anonymization and pseudonymization procedures",
      "Data access control records",
    ],
  },
  {
    annexRef: "A.7.5",
    categoryCode: "A.7",
    categoryName: "Data for AI systems",
    title: "Data documentation",
    description:
      "The organization shall maintain documentation for all datasets used in AI systems, including data dictionaries, provenance information, known limitations, and usage restrictions. Documentation shall be kept current and accessible.",
    suggestedEvidence: [
      "Dataset documentation or datasheets for datasets",
      "Data dictionaries and metadata catalogs",
      "Usage restriction and limitation records",
    ],
  },

  // ─── A.8 Information for Interested Parties ────────────────────────────────
  {
    annexRef: "A.8.1",
    categoryCode: "A.8",
    categoryName: "Information for interested parties",
    title: "AI system documentation",
    description:
      "The organization shall create and maintain technical documentation for each AI system, covering architecture, algorithms, training procedures, performance characteristics, and known limitations. Documentation shall be sufficient for audit and review purposes.",
    suggestedEvidence: [
      "Technical design documents and architecture diagrams",
      "Algorithm and model documentation",
      "Performance characteristic reports",
    ],
  },
  {
    annexRef: "A.8.2",
    categoryCode: "A.8",
    categoryName: "Information for interested parties",
    title: "User documentation",
    description:
      "The organization shall provide user documentation for AI systems that clearly explains the system's intended use, capabilities, limitations, and instructions for safe and effective operation. Documentation shall be accessible to the intended audience.",
    suggestedEvidence: [
      "User manuals and guides",
      "System capability and limitation descriptions",
      "User training materials and FAQs",
    ],
  },
  {
    annexRef: "A.8.3",
    categoryCode: "A.8",
    categoryName: "Information for interested parties",
    title: "Transparency reporting",
    description:
      "The organization shall publish transparency reports about its AI systems, covering their purpose, deployment scope, performance metrics, and any significant incidents. Reports shall be made available to relevant stakeholders at defined intervals.",
    suggestedEvidence: [
      "Published transparency reports",
      "AI system performance dashboards accessible to stakeholders",
      "Incident disclosure records",
    ],
  },
  {
    annexRef: "A.8.4",
    categoryCode: "A.8",
    categoryName: "Information for interested parties",
    title: "Communication with interested parties",
    description:
      "The organization shall establish channels for communicating with interested parties about its AI systems, including mechanisms for receiving feedback, handling complaints, and providing explanations of AI-driven decisions when requested.",
    suggestedEvidence: [
      "Stakeholder communication plan",
      "Feedback and complaint handling procedures",
      "Records of stakeholder inquiries and responses",
      "Explanation request and response logs",
    ],
  },

  // ─── A.9 Use of AI Systems ─────────────────────────────────────────────────
  {
    annexRef: "A.9.1",
    categoryCode: "A.9",
    categoryName: "Use of AI systems",
    title: "Responsible use policy",
    description:
      "The organization shall establish a responsible use policy that defines acceptable and unacceptable uses of AI systems. The policy shall address ethical boundaries, prohibited applications, and requirements for human oversight.",
    suggestedEvidence: [
      "Responsible AI use policy document",
      "Acceptable use guidelines for specific AI systems",
      "Policy acknowledgment records from users",
    ],
  },
  {
    annexRef: "A.9.2",
    categoryCode: "A.9",
    categoryName: "Use of AI systems",
    title: "AI system use monitoring",
    description:
      "The organization shall monitor how AI systems are being used to detect deviations from intended use, misuse patterns, and unauthorized applications. Monitoring shall include both automated checks and periodic human reviews.",
    suggestedEvidence: [
      "Usage monitoring dashboards and reports",
      "Deviation detection alerts and response records",
      "Periodic use review meeting minutes",
    ],
  },
  {
    annexRef: "A.9.3",
    categoryCode: "A.9",
    categoryName: "Use of AI systems",
    title: "AI use logging",
    description:
      "The organization shall implement logging mechanisms that capture AI system inputs, outputs, decisions, and user interactions. Logs shall be retained for an appropriate period to support auditing, investigation, and continuous improvement.",
    suggestedEvidence: [
      "Logging policy and retention schedules",
      "Sample audit logs demonstrating captured data",
      "Log storage and access control configurations",
    ],
  },
  {
    annexRef: "A.9.4",
    categoryCode: "A.9",
    categoryName: "Use of AI systems",
    title: "AI system misuse prevention",
    description:
      "The organization shall implement technical and organizational controls to prevent misuse of AI systems. Controls shall include access restrictions, input validation, output filtering, and user training on proper system use.",
    suggestedEvidence: [
      "Misuse prevention control documentation",
      "Access control and authorization configurations",
      "Input validation and output filtering specifications",
      "User training records on proper AI system use",
    ],
  },

  // ─── A.10 Third-party Relationships ────────────────────────────────────────
  {
    annexRef: "A.10.1",
    categoryCode: "A.10",
    categoryName: "Third-party relationships",
    title: "Third-party AI policy",
    description:
      "The organization shall establish a policy governing the use of third-party AI systems, components, and services. The policy shall define requirements for vendor selection, contractual obligations, and ongoing compliance expectations.",
    suggestedEvidence: [
      "Third-party AI policy document",
      "Vendor selection criteria and evaluation forms",
      "Contract templates with AI-specific clauses",
    ],
  },
  {
    annexRef: "A.10.2",
    categoryCode: "A.10",
    categoryName: "Third-party relationships",
    title: "Third-party AI assessment",
    description:
      "The organization shall assess third-party AI systems and services for risks related to bias, security, privacy, reliability, and compliance before adoption. Assessments shall be documented and used to inform procurement decisions.",
    suggestedEvidence: [
      "Third-party AI risk assessment reports",
      "Due diligence questionnaires and responses",
      "Assessment scoring records and approval decisions",
    ],
  },
  {
    annexRef: "A.10.3",
    categoryCode: "A.10",
    categoryName: "Third-party relationships",
    title: "Third-party AI monitoring",
    description:
      "The organization shall continuously monitor third-party AI systems and services for changes in risk posture, performance, and compliance. Monitoring shall include periodic reassessments and review of vendor-provided audit reports.",
    suggestedEvidence: [
      "Third-party monitoring schedule and reports",
      "Vendor audit report reviews",
      "Periodic reassessment records and action items",
    ],
  },
];
