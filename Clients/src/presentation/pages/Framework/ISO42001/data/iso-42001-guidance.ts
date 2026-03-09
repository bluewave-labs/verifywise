/**
 * ISO 42001 Annex B — Implementation guidance for Annex A controls.
 *
 * Annex B is non-normative (advisory). It provides practical guidance on how to
 * implement each Annex A control. This data is surfaced as contextual help text
 * inside the control detail page.
 */

export interface AnnexBGuidance {
  /** Matches the annexRef in ISO_42001_CONTROLS, e.g. "A.2.1" */
  annexRef: string;
  /** Short purpose statement */
  purpose: string;
  /** Step-by-step implementation guidance */
  steps: string[];
  /** Common pitfalls or things to watch out for */
  pitfalls?: string[];
  /** Links between this control and other controls */
  relatedControls?: string[];
}

export const ISO_42001_GUIDANCE: AnnexBGuidance[] = [
  // ─── A.2 AI Policies ────────────────────────────────────────────────────────

  {
    annexRef: "A.2.1",
    purpose:
      "Establish a top-level AI policy that signals the organization's commitment to responsible AI and sets expectations for all personnel.",
    steps: [
      "Draft the policy with input from senior management, legal, and technical stakeholders.",
      "Include the organization's AI vision, ethical principles, scope of AI use, and compliance obligations.",
      "Obtain formal approval from top management (e.g. board resolution or CEO sign-off).",
      "Communicate the policy to all employees, contractors, and relevant third parties.",
      "Publish the policy on internal channels (intranet, onboarding materials) and consider external publication.",
      "Schedule periodic reviews (at least annually) and after significant organizational or regulatory changes.",
    ],
    pitfalls: [
      "Writing a policy that is too vague to be actionable — include specific commitments and boundaries.",
      "Failing to communicate the policy beyond the compliance team.",
      "Not updating the policy when new AI regulations (e.g. EU AI Act) come into effect.",
    ],
    relatedControls: ["A.2.2", "A.2.3", "A.9.1"],
  },
  {
    annexRef: "A.2.2",
    purpose:
      "Define the governance structure that ensures AI systems are developed and used responsibly with clear accountability.",
    steps: [
      "Identify key governance roles: AI governance committee, AI ethics lead, system owners, data stewards.",
      "Define decision-making authority for AI system approval, deployment, and retirement.",
      "Create a RACI matrix mapping responsibilities across the AI lifecycle.",
      "Establish a governance committee with defined meeting cadence and escalation paths.",
      "Document the governance framework in a formal policy approved by leadership.",
      "Review and update the governance structure as the organization's AI maturity evolves.",
    ],
    pitfalls: [
      "Creating governance in name only without actual decision-making power.",
      "Concentrating all accountability in a single person rather than distributing appropriately.",
      "Not including diverse perspectives (legal, ethics, technical, business) in governance bodies.",
    ],
    relatedControls: ["A.2.1", "A.2.3", "A.3.1"],
  },
  {
    annexRef: "A.2.3",
    purpose:
      "Ensure every person involved with AI systems understands their specific responsibilities.",
    steps: [
      "Map all AI-related functions: development, data management, deployment, monitoring, incident response.",
      "Assign responsibilities to specific roles (not just individuals) for resilience.",
      "Document responsibilities in job descriptions, role charters, or a responsibility matrix.",
      "Communicate responsibilities during onboarding and role changes.",
      "Include AI responsibilities in performance reviews where appropriate.",
      "Review assignments when organizational structure changes or new AI systems are introduced.",
    ],
    pitfalls: [
      "Assuming technical teams alone are responsible — business owners, legal, and compliance also have roles.",
      "Not updating responsibilities when people leave or change roles.",
    ],
    relatedControls: ["A.2.2", "A.3.1", "A.3.3"],
  },
  {
    annexRef: "A.2.4",
    purpose:
      "Prevent unvetted AI systems from reaching production by defining what 'good enough' looks like before deployment.",
    steps: [
      "Define acceptance criteria for each AI system covering performance, fairness, safety, and compliance.",
      "Establish quantitative thresholds (e.g. accuracy > 95%, false positive rate < 2%, fairness metrics within bounds).",
      "Create a gate review process where criteria must be met before proceeding to the next lifecycle stage.",
      "Document who has authority to grant exceptions and under what conditions.",
      "Maintain records of all acceptance decisions, including any approved deviations.",
      "Review and update criteria as the system evolves and new risks emerge.",
    ],
    pitfalls: [
      "Setting criteria so low they are always met — criteria should be meaningful and risk-proportionate.",
      "Only measuring technical performance without considering fairness, safety, or user impact.",
      "Not revisiting criteria after the system has been in production and real-world behavior is observed.",
    ],
    relatedControls: ["A.5.1", "A.6.1", "A.6.3"],
  },

  // ─── A.3 Internal Organization ──────────────────────────────────────────────

  {
    annexRef: "A.3.1",
    purpose:
      "Assign dedicated AI roles with clear authority to ensure governance is not an afterthought.",
    steps: [
      "Identify required AI roles based on the organization's AI footprint (AI system owner, ethics lead, data steward, etc.).",
      "Define the scope, authority, and accountability for each role in a role charter.",
      "Formally appoint individuals and obtain their written acknowledgment.",
      "Ensure AI roles have appropriate seniority and access to influence decisions.",
      "Provide role-holders with the resources, training, and time needed to fulfill their duties.",
      "Review role assignments at least annually and when organizational changes occur.",
    ],
    pitfalls: [
      "Assigning AI governance roles as side duties without allocated time.",
      "Not giving role-holders the authority to escalate or block deployments when risks are identified.",
    ],
    relatedControls: ["A.2.2", "A.2.3", "A.3.2"],
  },
  {
    annexRef: "A.3.2",
    purpose:
      "Ensure personnel have the skills needed to develop, deploy, and oversee AI systems responsibly.",
    steps: [
      "Conduct a skills gap analysis for all AI-related roles.",
      "Define minimum competence requirements for each role (technical skills, ethics awareness, domain knowledge).",
      "Develop or procure training programs covering AI fundamentals, responsible AI practices, and relevant regulations.",
      "Track training completion and assess competence through evaluations or certifications.",
      "Establish a continuous learning program — AI is a fast-moving field.",
      "Document all competence assessments and training records as evidence.",
    ],
    pitfalls: [
      "Treating a one-time training session as sufficient — competence must be maintained over time.",
      "Focusing only on technical skills while neglecting ethics, bias awareness, and regulatory knowledge.",
    ],
    relatedControls: ["A.3.1", "A.3.3", "A.4.1"],
  },
  {
    annexRef: "A.3.3",
    purpose:
      "Make sure everyone who needs to know about AI responsibilities actually knows about them.",
    steps: [
      "Develop a communication plan specifying what AI information goes to which audiences.",
      "Include AI responsibilities in employee onboarding and contractor agreements.",
      "Use multiple channels: email, intranet, training sessions, team meetings.",
      "Require written acknowledgment of AI responsibilities from all relevant parties.",
      "Communicate changes to AI policies or responsibilities promptly.",
      "Periodically verify that personnel understand their AI-related obligations.",
    ],
    pitfalls: [
      "Relying solely on email for communication — people don't always read policy emails.",
      "Not communicating responsibilities to contractors and third parties who interact with AI systems.",
    ],
    relatedControls: ["A.2.3", "A.3.1", "A.8.4"],
  },

  // ─── A.4 Resources for AI Systems ──────────────────────────────────────────

  {
    annexRef: "A.4.1",
    purpose:
      "Ensure the organization allocates sufficient people, tools, infrastructure, and budget for AI activities.",
    steps: [
      "Inventory current AI initiatives and their resource requirements.",
      "Create a resource plan covering personnel, computing infrastructure, tools, and budget.",
      "Secure budget approval from management with clear justification linked to AI strategy.",
      "Establish procurement processes for AI-specific tools and services.",
      "Monitor resource utilization and adjust allocations as needs change.",
      "Document resource decisions and make them available for audit.",
    ],
    pitfalls: [
      "Underestimating the ongoing operational cost of AI systems (monitoring, retraining, infrastructure).",
      "Not budgeting for governance and compliance activities alongside development.",
    ],
    relatedControls: ["A.4.3", "A.4.5", "A.6.1"],
  },
  {
    annexRef: "A.4.2",
    purpose:
      "Establish robust data management practices that ensure AI systems are built on high-quality, appropriate data.",
    steps: [
      "Create a data management policy covering collection, storage, processing, retention, and disposal.",
      "Build and maintain a data inventory or catalog for all datasets used in AI systems.",
      "Implement data quality checks at ingestion, transformation, and consumption stages.",
      "Define data ownership and stewardship responsibilities.",
      "Establish data lifecycle management including archival and secure disposal.",
      "Ensure compliance with data protection regulations (GDPR, etc.) through privacy impact assessments.",
    ],
    pitfalls: [
      "Treating data management as a one-time setup rather than an ongoing discipline.",
      "Not tracking data lineage — knowing where data came from and how it was transformed is critical for audits.",
    ],
    relatedControls: ["A.7.1", "A.7.2", "A.7.4"],
  },
  {
    annexRef: "A.4.3",
    purpose:
      "Provision reliable computing infrastructure to support AI development, testing, and production workloads.",
    steps: [
      "Assess computing requirements for training, inference, and monitoring workloads.",
      "Select appropriate infrastructure (cloud, on-premises, hybrid) based on requirements and constraints.",
      "Implement capacity planning to handle peak loads and growth.",
      "Establish environments for development, testing, staging, and production with appropriate isolation.",
      "Document infrastructure architecture and maintain configuration records.",
      "Monitor resource usage and costs; optimize as needed.",
    ],
    pitfalls: [
      "Not separating development and production environments, risking accidental data exposure.",
      "Underestimating GPU/compute costs for model training and retraining.",
    ],
    relatedControls: ["A.4.1", "A.4.5", "A.6.4"],
  },
  {
    annexRef: "A.4.4",
    purpose:
      "Keep stakeholders informed about AI resource availability, constraints, and changes.",
    steps: [
      "Identify stakeholders who need information about AI resources (development teams, management, operations).",
      "Establish regular communication channels: dashboards, status reports, team meetings.",
      "Communicate resource constraints and their impact on AI project timelines.",
      "Notify stakeholders promptly when resource changes affect their work.",
      "Document communication records as evidence of proactive resource management.",
    ],
    pitfalls: [
      "Only communicating when things go wrong rather than maintaining regular visibility.",
      "Not communicating resource limitations to business stakeholders who may have unrealistic expectations.",
    ],
    relatedControls: ["A.4.1", "A.4.5", "A.8.4"],
  },
  {
    annexRef: "A.4.5",
    purpose:
      "Ensure AI systems remain operational even when infrastructure or personnel disruptions occur.",
    steps: [
      "Identify critical AI systems and their resource dependencies.",
      "Create business continuity plans specific to AI operations (failover, backup, disaster recovery).",
      "Implement redundancy for critical infrastructure components.",
      "Define and test recovery procedures, including model rollback capabilities.",
      "Establish SLAs for AI system availability and monitor against them.",
      "Conduct regular disaster recovery drills and document results.",
    ],
    pitfalls: [
      "Having a business continuity plan on paper but never testing it.",
      "Not considering model-specific recovery (e.g. can you redeploy the previous model version quickly?).",
    ],
    relatedControls: ["A.4.1", "A.4.3", "A.6.4"],
  },

  // ─── A.5 Assessing Impacts of AI Systems ──────────────────────────────────

  {
    annexRef: "A.5.1",
    purpose:
      "Define a repeatable methodology for evaluating AI impacts before harm occurs.",
    steps: [
      "Research existing impact assessment frameworks (e.g. ALTAI, NIST AI RMF, Canadian AIA).",
      "Adapt a methodology appropriate to your organization's risk appetite and AI use cases.",
      "Define impact categories: ethical, legal, social, environmental, economic, safety.",
      "Create scoring criteria for likelihood and severity of impacts.",
      "Establish thresholds that trigger deeper assessment or management review.",
      "Document the methodology and train assessors on its application.",
      "Review and update the methodology based on lessons learned from completed assessments.",
    ],
    pitfalls: [
      "Making the methodology too complex for teams to actually use it.",
      "Not involving affected stakeholders (users, communities) in defining impact categories.",
      "Using a generic checklist without adapting it to specific AI system contexts.",
    ],
    relatedControls: ["A.5.2", "A.5.3", "A.2.4"],
  },
  {
    annexRef: "A.5.2",
    purpose:
      "Evaluate each AI system's potential for harm to individuals, groups, and society before deployment.",
    steps: [
      "Conduct an impact assessment for each AI system using the methodology from A.5.1.",
      "Identify all stakeholders who may be affected by the AI system (direct users, subjects, third parties).",
      "Assess risks to fundamental rights, safety, fairness, privacy, and dignity.",
      "Consult with affected stakeholders or their representatives where possible.",
      "Document findings, risk ratings, and proposed mitigation measures.",
      "Obtain management sign-off on the assessment before proceeding with deployment.",
      "Schedule reassessments at regular intervals and after significant system changes.",
    ],
    pitfalls: [
      "Conducting assessments as a box-ticking exercise without genuine analysis.",
      "Only assessing intended use without considering foreseeable misuse.",
      "Not reassessing when the system's context or user base changes significantly.",
    ],
    relatedControls: ["A.5.1", "A.5.3", "A.5.4"],
  },
  {
    annexRef: "A.5.3",
    purpose:
      "Maintain thorough records of impact assessments to demonstrate due diligence to auditors and regulators.",
    steps: [
      "Create a standardized template for impact assessment documentation.",
      "Record the scope, participants, methodology used, findings, and decisions for each assessment.",
      "Include any dissenting opinions or unresolved concerns in the documentation.",
      "Maintain version control on assessment documents as they are updated.",
      "Store documentation securely with appropriate access controls.",
      "Retain documents for the required period (consider regulatory requirements and system lifecycle).",
    ],
    pitfalls: [
      "Documenting only the final outcome without capturing the reasoning and deliberation process.",
      "Not archiving superseded versions — auditors may want to see how assessments evolved.",
    ],
    relatedControls: ["A.5.1", "A.5.2", "A.5.4"],
  },
  {
    annexRef: "A.5.4",
    purpose:
      "Keep impact assessments current by reviewing them when conditions change.",
    steps: [
      "Define triggers for reassessment: material system changes, new regulations, incident reports, scheduled reviews.",
      "Establish a review schedule (e.g. annually or after each major release).",
      "Compare current system behavior and context against the original assessment assumptions.",
      "Update the assessment document to reflect new findings and changed risk levels.",
      "Communicate changes in risk posture to relevant stakeholders and management.",
      "Track reassessment actions to completion.",
    ],
    pitfalls: [
      "Only reviewing on schedule without monitoring for trigger events.",
      "Not considering changes in the external environment (new regulations, societal expectations).",
    ],
    relatedControls: ["A.5.1", "A.5.2", "A.5.3"],
  },

  // ─── A.6 AI System Lifecycle ───────────────────────────────────────────────

  {
    annexRef: "A.6.1",
    purpose:
      "Govern the entire AI system lifecycle from concept to retirement with defined processes at each stage.",
    steps: [
      "Define lifecycle stages: planning, design, development, testing, deployment, operation, monitoring, retirement.",
      "Establish entry and exit criteria (gates) for each stage.",
      "Assign ownership for each stage and define handoff procedures.",
      "Create process documentation and templates for each lifecycle stage.",
      "Implement a stage-gate review process with management oversight.",
      "Track all AI systems through their lifecycle in a central inventory or registry.",
    ],
    pitfalls: [
      "Applying the same heavyweight process to all systems regardless of risk — scale governance to risk level.",
      "Not including retirement planning from the start — it is often overlooked.",
    ],
    relatedControls: ["A.2.4", "A.6.3", "A.6.6"],
  },
  {
    annexRef: "A.6.2",
    purpose:
      "Ensure training and testing data is fit for purpose, representative, and properly documented.",
    steps: [
      "Document data requirements for each AI system (volume, features, representativeness, quality).",
      "Assess datasets for bias, completeness, and representativeness of the target population.",
      "Record data provenance: where it came from, how it was collected, any transformations applied.",
      "Verify data licensing and ensure legal right to use the data for AI training.",
      "Create dataset documentation (datasheets for datasets, model cards) for each training dataset.",
      "Implement data versioning so training runs can be reproduced.",
    ],
    pitfalls: [
      "Using convenience samples that don't represent the real-world population the AI will serve.",
      "Not checking if training data contains personally identifiable information requiring consent.",
      "Failing to version datasets, making it impossible to reproduce or audit past training runs.",
    ],
    relatedControls: ["A.4.2", "A.7.1", "A.7.2", "A.7.3"],
  },
  {
    annexRef: "A.6.3",
    purpose:
      "Validate that AI systems meet requirements through comprehensive testing before deployment.",
    steps: [
      "Develop a testing strategy covering functional, performance, fairness, robustness, and adversarial testing.",
      "Define test cases and expected outcomes for each testing dimension.",
      "Test with diverse and representative test data, including edge cases.",
      "Conduct fairness testing across protected groups and document results.",
      "Perform adversarial testing to assess resilience to manipulated inputs.",
      "Document all test results and obtain sign-off before proceeding to deployment.",
      "Establish regression testing procedures for model updates.",
    ],
    pitfalls: [
      "Only testing accuracy without testing for bias, robustness, or adversarial inputs.",
      "Using the same data for training and testing (data leakage).",
      "Not testing with the same infrastructure configuration that will be used in production.",
    ],
    relatedControls: ["A.2.4", "A.6.1", "A.6.2"],
  },
  {
    annexRef: "A.6.4",
    purpose:
      "Define clear procedures for running AI systems in production with appropriate human oversight.",
    steps: [
      "Create operational runbooks covering normal operations, exception handling, and escalation.",
      "Define performance baselines and alert thresholds for production systems.",
      "Establish human oversight mechanisms appropriate to the system's risk level.",
      "Document escalation paths for when AI system behavior is unexpected.",
      "Implement change management procedures for model updates in production.",
      "Maintain operational logs and make them available for audit.",
    ],
    pitfalls: [
      "Deploying AI systems without runbooks or escalation procedures.",
      "Not defining what 'unexpected behavior' looks like, so operators don't know when to escalate.",
      "Over-relying on automation without meaningful human oversight.",
    ],
    relatedControls: ["A.6.1", "A.6.5", "A.9.2"],
  },
  {
    annexRef: "A.6.5",
    purpose:
      "Detect performance degradation, data drift, and fairness drift in production AI systems before they cause harm.",
    steps: [
      "Define monitoring metrics: accuracy, latency, data drift, concept drift, fairness metrics.",
      "Implement automated monitoring with dashboards and alerting.",
      "Set alert thresholds that trigger investigation or automatic rollback.",
      "Establish a cadence for human review of monitoring outputs.",
      "Document and investigate all triggered alerts, even false alarms.",
      "Use monitoring insights to inform model retraining and improvement cycles.",
    ],
    pitfalls: [
      "Monitoring only technical metrics (latency, uptime) without monitoring AI-specific metrics (drift, fairness).",
      "Setting thresholds too loose so degradation goes undetected, or too tight creating alert fatigue.",
    ],
    relatedControls: ["A.6.4", "A.6.6", "A.9.2"],
  },
  {
    annexRef: "A.6.6",
    purpose:
      "Retire AI systems in an orderly way that minimizes disruption and preserves required records.",
    steps: [
      "Define retirement criteria (when a system should be retired: obsolescence, replacement, risk).",
      "Conduct a dependency analysis to identify systems and processes that rely on the AI system.",
      "Create a retirement plan covering stakeholder notification, data handling, and transition.",
      "Archive model artifacts, training data references, and documentation as required by policy.",
      "Securely dispose of data that is no longer needed, following data protection requirements.",
      "Communicate the retirement timeline and provide alternatives to affected users.",
      "Document the retirement decision and completion.",
    ],
    pitfalls: [
      "Leaving retired AI systems running because no one took responsibility for shutting them down.",
      "Not preserving audit trail and documentation after retirement.",
      "Forgetting to notify downstream systems or users that depend on the AI system.",
    ],
    relatedControls: ["A.6.1", "A.6.4", "A.6.5"],
  },

  // ─── A.7 Data for AI Systems ───────────────────────────────────────────────

  {
    annexRef: "A.7.1",
    purpose:
      "Ensure all data used in AI systems is obtained lawfully, ethically, and with proper authorization.",
    steps: [
      "Create a data acquisition procedure that covers sourcing, licensing, consent, and ethical review.",
      "Maintain a register of all data sources with licensing terms and acquisition dates.",
      "Verify legal basis for data processing (consent, legitimate interest, contract, etc.).",
      "Conduct ethical review for data collected from or about individuals.",
      "Vet third-party data providers for quality, reliability, and ethical practices.",
      "Document acquisition decisions and retain consent records.",
    ],
    pitfalls: [
      "Scraping data from the internet without checking terms of service or copyright.",
      "Assuming purchased data is free from bias or quality issues.",
      "Not maintaining records that demonstrate lawful acquisition for auditors.",
    ],
    relatedControls: ["A.4.2", "A.7.2", "A.7.4"],
  },
  {
    annexRef: "A.7.2",
    purpose:
      "Maintain high data quality so AI systems produce reliable and fair outputs.",
    steps: [
      "Define data quality dimensions relevant to your AI use cases (accuracy, completeness, consistency, timeliness).",
      "Implement automated data quality checks in data pipelines.",
      "Establish data quality metrics and measure them regularly.",
      "Create processes for identifying and resolving data quality issues.",
      "Document data quality baselines and track improvements over time.",
      "Report data quality status to data stewards and AI system owners.",
    ],
    pitfalls: [
      "Assuming data is clean because it came from a 'trusted' source.",
      "Not defining what 'good enough' quality means for each use case.",
      "Ignoring data quality issues in production data that differs from training data.",
    ],
    relatedControls: ["A.4.2", "A.7.1", "A.7.3"],
  },
  {
    annexRef: "A.7.3",
    purpose:
      "Ensure labeled data is accurate and consistent so AI models learn the right patterns.",
    steps: [
      "Create clear, detailed labeling guidelines with examples for each label category.",
      "Train annotators on the guidelines and assess their understanding before they begin.",
      "Implement inter-annotator agreement (IAA) measurements and set minimum thresholds.",
      "Establish a quality review process with random sampling of labeled data.",
      "Resolve ambiguous cases through a defined adjudication process.",
      "Version labeling guidelines and retrain annotators when guidelines change.",
    ],
    pitfalls: [
      "Having vague labeling guidelines that lead to inconsistent annotations.",
      "Not measuring inter-annotator agreement, so you don't know if labels are reliable.",
      "Using a single annotator per item without any quality verification.",
    ],
    relatedControls: ["A.6.2", "A.7.1", "A.7.2"],
  },
  {
    annexRef: "A.7.4",
    purpose:
      "Protect personal and sensitive data used in AI systems throughout its lifecycle.",
    steps: [
      "Conduct a privacy impact assessment (PIA/DPIA) for AI systems that process personal data.",
      "Implement data minimization — only collect and retain data necessary for the AI purpose.",
      "Apply anonymization or pseudonymization techniques where possible.",
      "Implement access controls limiting who can access personal data in AI pipelines.",
      "Ensure compliance with applicable data protection regulations (GDPR, CCPA, etc.).",
      "Maintain records of processing activities and data subject rights procedures.",
    ],
    pitfalls: [
      "Assuming that aggregated data is always anonymous — re-identification is often possible.",
      "Not considering privacy implications of model outputs (e.g. memorization of training data).",
      "Failing to implement data subject rights (access, deletion) for data used in AI training.",
    ],
    relatedControls: ["A.4.2", "A.7.1", "A.7.5"],
  },
  {
    annexRef: "A.7.5",
    purpose:
      "Document all datasets so that their provenance, characteristics, and limitations are transparent.",
    steps: [
      "Create a dataset documentation template (based on 'Datasheets for Datasets' or similar frameworks).",
      "Document each dataset's purpose, source, collection methodology, size, and format.",
      "Record known limitations, biases, and representativeness gaps.",
      "Document any preprocessing or transformation steps applied to the data.",
      "Maintain data dictionaries defining all fields, types, and allowed values.",
      "Keep documentation up to date as datasets evolve.",
    ],
    pitfalls: [
      "Creating documentation once and never updating it as the dataset changes.",
      "Not documenting known biases or limitations — these are critical for downstream users.",
    ],
    relatedControls: ["A.7.1", "A.7.2", "A.8.1"],
  },

  // ─── A.8 Information for Interested Parties ────────────────────────────────

  {
    annexRef: "A.8.1",
    purpose:
      "Create technical documentation sufficient for audit, review, and knowledge transfer.",
    steps: [
      "Create a technical documentation template covering architecture, algorithms, data, and performance.",
      "Document model architecture, hyperparameters, training procedure, and evaluation results.",
      "Include system architecture diagrams showing data flows and integration points.",
      "Document known limitations, failure modes, and conditions where the system may not perform well.",
      "Maintain version history of documentation alongside model versions.",
      "Make documentation accessible to auditors, reviewers, and relevant technical staff.",
    ],
    pitfalls: [
      "Documentation that is too high-level to be useful for auditors or new team members.",
      "Not updating documentation when the model or system architecture changes.",
      "Keeping documentation separate from the system it describes, leading to drift.",
    ],
    relatedControls: ["A.7.5", "A.8.2", "A.8.3"],
  },
  {
    annexRef: "A.8.2",
    purpose:
      "Help users understand AI system capabilities and limitations so they can use it safely and effectively.",
    steps: [
      "Identify the target audience and their level of technical understanding.",
      "Document the system's intended use, capabilities, and known limitations in plain language.",
      "Provide clear instructions for operation, including input requirements and output interpretation.",
      "Include warnings about potential misuse or situations where the system may be unreliable.",
      "Create training materials (guides, videos, FAQs) tailored to different user groups.",
      "Establish a feedback mechanism for users to report issues or request clarification.",
    ],
    pitfalls: [
      "Writing documentation in technical jargon that end users cannot understand.",
      "Overstating system capabilities and understating limitations.",
      "Not explaining how to interpret AI outputs, especially probabilistic ones.",
    ],
    relatedControls: ["A.8.1", "A.8.4", "A.9.1"],
  },
  {
    annexRef: "A.8.3",
    purpose:
      "Build trust with stakeholders through proactive disclosure about AI system performance and incidents.",
    steps: [
      "Define what information will be included in transparency reports (purpose, scope, performance, incidents).",
      "Establish a reporting cadence (e.g. quarterly or annually).",
      "Identify the target audience for transparency reports (regulators, customers, public).",
      "Include both positive outcomes and challenges or incidents in reports.",
      "Publish reports through appropriate channels (website, direct communication, regulatory submissions).",
      "Track and respond to stakeholder feedback on transparency reports.",
    ],
    pitfalls: [
      "Publishing only positive information and omitting challenges or incidents.",
      "Making reports so technical that non-expert stakeholders cannot understand them.",
      "Not following through on commitments made in transparency reports.",
    ],
    relatedControls: ["A.8.1", "A.8.4", "A.9.3"],
  },
  {
    annexRef: "A.8.4",
    purpose:
      "Enable two-way communication with stakeholders so concerns are heard and addressed.",
    steps: [
      "Identify all interested parties: end users, affected individuals, regulators, partners, public.",
      "Establish communication channels appropriate for each audience (helpdesk, email, public forum).",
      "Create a process for receiving and responding to feedback and complaints.",
      "Implement a mechanism for individuals to request explanations of AI-driven decisions.",
      "Track all communications and ensure timely responses.",
      "Feed stakeholder input back into AI system improvement and risk management processes.",
    ],
    pitfalls: [
      "Establishing communication channels but not actually monitoring or responding to them.",
      "Not providing explanations of AI decisions when individuals are significantly affected.",
      "Treating stakeholder communication as a one-time PR exercise rather than an ongoing relationship.",
    ],
    relatedControls: ["A.3.3", "A.8.2", "A.8.3"],
  },

  // ─── A.9 Use of AI Systems ─────────────────────────────────────────────────

  {
    annexRef: "A.9.1",
    purpose:
      "Set clear boundaries for how AI systems may and may not be used within the organization.",
    steps: [
      "Define acceptable use cases and explicitly list prohibited uses (e.g. social scoring, discriminatory profiling).",
      "Specify requirements for human oversight for each risk level of AI application.",
      "Include ethical boundaries that go beyond legal compliance.",
      "Communicate the policy to all AI system users and obtain acknowledgment.",
      "Establish reporting mechanisms for suspected policy violations.",
      "Review the policy when new AI capabilities or use cases emerge.",
    ],
    pitfalls: [
      "Being too vague about what constitutes 'responsible use' — provide concrete examples.",
      "Not addressing emerging use cases as AI capabilities evolve (e.g. generative AI).",
      "Having a policy but no enforcement mechanism or violation reporting channel.",
    ],
    relatedControls: ["A.2.1", "A.8.2", "A.9.4"],
  },
  {
    annexRef: "A.9.2",
    purpose:
      "Detect when AI systems are being used in ways they were not intended for.",
    steps: [
      "Define expected usage patterns for each AI system (frequency, input types, user roles).",
      "Implement automated monitoring to detect deviations from expected usage.",
      "Create dashboards for human reviewers to analyze usage patterns.",
      "Establish escalation procedures when deviations or misuse patterns are detected.",
      "Conduct periodic manual reviews of AI system usage beyond automated monitoring.",
      "Document all detected deviations, investigations, and corrective actions.",
    ],
    pitfalls: [
      "Only monitoring availability and performance without monitoring how the system is actually being used.",
      "Not defining what 'abnormal usage' looks like, so deviations go undetected.",
    ],
    relatedControls: ["A.6.5", "A.9.1", "A.9.3"],
  },
  {
    annexRef: "A.9.3",
    purpose:
      "Maintain an audit trail of AI system usage for accountability, investigation, and improvement.",
    steps: [
      "Define what information to log: inputs, outputs, decisions, user identity, timestamps.",
      "Implement logging in a way that does not compromise system performance or user privacy.",
      "Establish log retention periods based on regulatory requirements and audit needs.",
      "Implement access controls on logs to prevent tampering and protect sensitive information.",
      "Create procedures for accessing logs during investigations or audits.",
      "Regularly verify that logging is functioning correctly and capturing required information.",
    ],
    pitfalls: [
      "Logging too much (privacy risk) or too little (insufficient for audit).",
      "Not protecting logs from tampering — immutable logging is preferred.",
      "Retaining logs longer than necessary, creating unnecessary privacy risk.",
    ],
    relatedControls: ["A.9.1", "A.9.2", "A.9.4"],
  },
  {
    annexRef: "A.9.4",
    purpose:
      "Implement safeguards to prevent intentional or accidental misuse of AI systems.",
    steps: [
      "Identify potential misuse scenarios for each AI system through threat modeling.",
      "Implement technical controls: access restrictions, input validation, output filtering, rate limiting.",
      "Deploy organizational controls: training, acceptable use policies, supervision.",
      "Implement safeguards against prompt injection, adversarial inputs, and data poisoning where applicable.",
      "Establish incident response procedures for detected misuse.",
      "Test misuse prevention controls regularly and update them as threats evolve.",
    ],
    pitfalls: [
      "Only considering external threats while ignoring internal misuse.",
      "Implementing controls that are too restrictive, preventing legitimate use.",
      "Not updating misuse prevention measures as attack techniques evolve.",
    ],
    relatedControls: ["A.6.3", "A.9.1", "A.9.2"],
  },

  // ─── A.10 Third-party Relationships ────────────────────────────────────────

  {
    annexRef: "A.10.1",
    purpose:
      "Set clear expectations and requirements for third-party AI systems and services before adoption.",
    steps: [
      "Create a third-party AI policy covering evaluation criteria, contractual requirements, and ongoing obligations.",
      "Define vendor selection criteria: technical quality, fairness practices, security, compliance track record.",
      "Include AI-specific clauses in contracts: data handling, model transparency, incident notification, audit rights.",
      "Establish a procurement review process that includes AI risk assessment.",
      "Maintain a register of all third-party AI systems and services in use.",
      "Review the policy and vendor register regularly.",
    ],
    pitfalls: [
      "Treating AI vendors the same as commodity IT vendors without assessing AI-specific risks.",
      "Not securing audit rights or transparency requirements in contracts.",
      "Adopting third-party AI tools without going through the evaluation process (shadow AI).",
    ],
    relatedControls: ["A.10.2", "A.10.3", "A.2.1"],
  },
  {
    annexRef: "A.10.2",
    purpose:
      "Evaluate third-party AI systems for risks before adopting them into your operations.",
    steps: [
      "Develop an assessment questionnaire covering bias, security, privacy, reliability, and regulatory compliance.",
      "Request documentation from vendors: model cards, testing results, fairness assessments.",
      "Conduct independent testing of third-party AI systems where possible.",
      "Assess the vendor's incident response capabilities and notification commitments.",
      "Document assessment findings and make procurement decisions based on risk evaluation.",
      "Require vendors to notify you of material changes to their AI systems.",
    ],
    pitfalls: [
      "Relying solely on vendor self-assessments without independent verification.",
      "Not assessing the vendor's data practices (where does the data go? is it used for training?).",
      "Doing a one-time assessment at procurement without ongoing reassessment.",
    ],
    relatedControls: ["A.10.1", "A.10.3", "A.5.2"],
  },
  {
    annexRef: "A.10.3",
    purpose:
      "Continuously monitor third-party AI systems to detect changes in risk, performance, or compliance.",
    steps: [
      "Establish a monitoring schedule for each third-party AI system based on its risk level.",
      "Define metrics to monitor: performance, availability, compliance status, incident reports.",
      "Review vendor-provided audit reports, SOC reports, and compliance certifications.",
      "Conduct periodic reassessments using the criteria from A.10.2.",
      "Monitor for news about vendor incidents, regulatory actions, or significant changes.",
      "Document monitoring results and escalate concerns through the governance process.",
      "Have exit plans ready in case a third-party relationship needs to be terminated.",
    ],
    pitfalls: [
      "Assuming that initial assessment is sufficient — third-party risks change over time.",
      "Not having an exit plan if a vendor's risk posture becomes unacceptable.",
      "Ignoring vendor notifications about system changes or incidents.",
    ],
    relatedControls: ["A.10.1", "A.10.2", "A.6.5"],
  },
];
