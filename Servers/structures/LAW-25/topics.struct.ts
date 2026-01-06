/**
 * Quebec Law 25 - Privacy Protection Framework
 * Structure definition for compliance requirements
 */

export interface Law25Requirement {
  id: string;
  order: number;
  name: string;
  summary: string;
  key_questions: string[];
  evidence_examples: string[];
}

export interface Law25Topic {
  id: string;
  order: number;
  name: string;
  requirements: Law25Requirement[];
}

export const Law25Topics: Law25Topic[] = [
  {
    id: "L25-1",
    order: 1,
    name: "Chapter L25-1, Context and Scope",
    requirements: [
      {
        id: "L25-1.1",
        order: 1,
        name: "L25-1.1 Applicability of Law 25 to the Organization",
        summary: "Determine whether Quebec Law 25 applies to the organization based on its activities, geographic reach, and processing of personal information relating to individuals in Quebec.",
        key_questions: [
          "Do we collect, use, store, or share personal information of individuals located in Quebec?",
          "Do our products or services target Quebec residents, directly or indirectly?",
          "Do we operate systems, platforms, or AI services that process personal information linked to Quebec?",
          "Has the applicability decision been formally documented and approved?"
        ],
        evidence_examples: [
          "Law 25 applicability assessment or legal memo",
          "Documentation describing business operations in or affecting Quebec",
          "Data flow or system diagrams showing processing of Quebec personal information",
          "Management or privacy officer approval of applicability determination"
        ]
      },
      {
        id: "L25-1.2",
        order: 2,
        name: "L25-1.2 Identification of Covered Personal Information",
        summary: "Identify the categories of personal information processed by the organization that fall within the scope of Law 25, including any sensitive personal information and the purposes for which it is processed.",
        key_questions: [
          "What categories of personal information do we collect, use, store, or disclose?",
          "Which data elements are considered sensitive in our context, and where do we process them?",
          "For each category of personal information, what is the documented purpose and lawful basis for processing?",
          "Do we know which products, features, or workflows generate or consume each category of personal information?"
        ],
        evidence_examples: [
          "Personal information inventory, categorized by type and purpose",
          "Data classification and sensitivity labeling scheme",
          "Records of processing activities or equivalent internal register",
          "Source to system mapping showing where each personal information category is collected and stored"
        ]
      },
      {
        id: "L25-1.3",
        order: 3,
        name: "L25-1.3 Scope of Systems and Business Units",
        summary: "Define which systems, products, services, business units, and operational processes are in scope for Law 25 compliance, based on where personal information is processed.",
        key_questions: [
          "Which applications, databases, analytics tools, AI systems, and integrations process personal information?",
          "Which teams or business units own or operate the in-scope systems and processes?",
          "Are there any systems declared out of scope, and is the justification documented and defensible?",
          "How do we keep scope current when new systems are introduced or existing systems change?"
        ],
        evidence_examples: [
          "System inventory with personal information processing flags",
          "Architecture diagrams and data flow diagrams",
          "In-scope and out-of-scope statement with justifications",
          "Ownership register linking systems to accountable teams"
        ]
      },
      {
        id: "L25-1.4",
        order: 4,
        name: "L25-1.4 Compliance Boundaries and Assumptions",
        summary: "Document the boundaries, assumptions, and constraints that define how Law 25 compliance is implemented, including geographic, technical, and organizational limits and any known gaps.",
        key_questions: [
          "What are the geographic boundaries of our compliance posture, for example Quebec only, Canada wide, or global?",
          "What are the technical boundaries, for example production only, staging environments, backups, logs, and analytics?",
          "What assumptions are we making about user location, identity, and data residency, and how are they validated?",
          "What known gaps or transitional states exist, and do we have a plan and timeline to address them?"
        ],
        evidence_examples: [
          "Compliance boundary statement, including inclusions and exclusions",
          "Data residency and environment scope documentation, including backups and logs",
          "Assumption register, including validation methods",
          "Gap log with planned remediation actions and target dates"
        ]
      },
      {
        id: "L25-1.5",
        order: 5,
        name: "L25-1.5 Approval and Periodic Review of Context and Scope",
        summary: "Ensure the Law 25 context and scope are formally approved by the appropriate owner and reviewed at a defined frequency or when material changes occur.",
        key_questions: [
          "Who is accountable for approving the Law 25 scope and context, and is this recorded?",
          "What is our review cadence, and what triggers an out of cycle review, such as new markets, new vendors, or new data flows?",
          "Do we track scope change history and the rationale for changes?",
          "Are scope and context reviews tied to change management, product launches, or major architecture updates?"
        ],
        evidence_examples: [
          "Approval record, meeting notes, or sign off workflow output",
          "Defined review schedule and trigger criteria",
          "Scope change log with dates, owners, and rationales",
          "Change management records that reference scope review for new systems or features"
        ]
      }
    ]
  },
  {
    id: "L25-2",
    order: 2,
    name: "Chapter L25-2, Leadership and Accountability",
    requirements: [
      {
        id: "L25-2.1",
        order: 1,
        name: "L25-2.1 Designation of the Person Responsible for the Protection of Personal Information",
        summary: "Ensure that a person responsible for the protection of personal information is formally designated, as required by Law 25, with clear authority and accountability.",
        key_questions: [
          "Has a person responsible for the protection of personal information been formally designated?",
          "Is this responsibility assumed by the CEO by default or delegated in writing?",
          "Is the designated person aware of and trained on their Law 25 responsibilities?",
          "Is this role visible and communicated internally and externally where appropriate?"
        ],
        evidence_examples: [
          "Formal designation document or resolution",
          "Written delegation from the CEO, if applicable",
          "Role description outlining privacy responsibilities",
          "Internal or external communication naming the responsible person"
        ]
      },
      {
        id: "L25-2.2",
        order: 2,
        name: "L25-2.2 Definition of Roles and Responsibilities for Privacy Governance",
        summary: "Define and document roles, responsibilities, and reporting lines related to personal information protection across the organization.",
        key_questions: [
          "Are privacy related roles and responsibilities clearly defined across teams?",
          "Do system owners, product teams, and vendors know their privacy obligations?",
          "Are escalation paths defined for privacy incidents or compliance issues?",
          "Is there clear separation between decision making, oversight, and execution?"
        ],
        evidence_examples: [
          "Privacy governance or responsibility matrix",
          "Job descriptions referencing privacy obligations",
          "Organizational charts showing reporting lines",
          "Incident escalation and decision flow documentation"
        ]
      },
      {
        id: "L25-2.3",
        order: 3,
        name: "L25-2.3 Leadership Oversight and Commitment",
        summary: "Demonstrate leadership commitment to Law 25 compliance through oversight, resource allocation, and active involvement in privacy governance.",
        key_questions: [
          "Does leadership actively oversee privacy and personal information protection?",
          "Are sufficient resources allocated to meet Law 25 obligations?",
          "Are privacy risks and incidents reported to leadership on a regular basis?",
          "Is privacy considered in strategic, product, and technology decisions?"
        ],
        evidence_examples: [
          "Leadership or board meeting minutes referencing privacy topics",
          "Budget or resource allocation records for privacy activities",
          "Periodic privacy status or risk reports to leadership",
          "Strategic or product documents referencing privacy considerations"
        ]
      },
      {
        id: "L25-2.4",
        order: 4,
        name: "L25-2.4 Accountability and Decision Documentation",
        summary: "Ensure that key decisions related to personal information protection are documented, traceable, and attributable to accountable roles.",
        key_questions: [
          "Are major privacy related decisions formally documented?",
          "Can we trace decisions to accountable individuals or roles?",
          "Are trade offs between business objectives and privacy risks recorded?",
          "Do we retain decision records long enough to support audits or investigations?"
        ],
        evidence_examples: [
          "Decision logs related to privacy and personal information",
          "Risk acceptance or exception records",
          "Approval workflows with named approvers",
          "Retention rules for governance and decision records"
        ]
      }
    ]
  },
  {
    id: "L25-3",
    order: 3,
    name: "Chapter L25-3, Privacy Governance and Policies",
    requirements: [
      {
        id: "L25-3.1",
        order: 1,
        name: "L25-3.1 Public Privacy Notice",
        summary: "Ensure that a clear, accessible, and up-to-date privacy notice is made publicly available, describing how personal information is collected, used, retained, and disclosed in accordance with Law 25.",
        key_questions: [
          "Do we publish a privacy notice that is easily accessible to individuals?",
          "Does the notice clearly describe what personal information is collected and for what purposes?",
          "Is the language used clear, plain, and understandable to a non-technical audience?",
          "Is the privacy notice reviewed and updated when practices change?"
        ],
        evidence_examples: [
          "Published privacy notice with URL",
          "Version history or change log for the privacy notice",
          "Internal review or approval records for the privacy notice",
          "Change management records triggering notice updates"
        ]
      },
      {
        id: "L25-3.2",
        order: 2,
        name: "L25-3.2 Internal Privacy Policies and Procedures",
        summary: "Establish and maintain internal policies and procedures governing the handling of personal information, aligned with Law 25 requirements and organizational practices.",
        key_questions: [
          "Do we have documented internal policies governing personal information protection?",
          "Are procedures defined for collection, use, disclosure, retention, and destruction of personal information?",
          "Are these policies communicated to relevant employees and contractors?",
          "Are policies reviewed periodically and aligned with actual operational practices?"
        ],
        evidence_examples: [
          "Internal privacy policy documents",
          "Standard operating procedures for personal information handling",
          "Employee communications or acknowledgements",
          "Policy review and update records"
        ]
      },
      {
        id: "L25-3.3",
        order: 3,
        name: "L25-3.3 Purpose Specification and Limitation",
        summary: "Ensure that purposes for collecting and using personal information are defined, documented, and limited to what is necessary, as required by Law 25.",
        key_questions: [
          "Have we clearly defined the purposes for which personal information is collected?",
          "Are purposes documented before or at the time of collection?",
          "Do we prevent the use of personal information for incompatible or undocumented purposes?",
          "Are purpose changes reviewed and approved before implementation?"
        ],
        evidence_examples: [
          "Purpose register or records of processing",
          "Product or feature documentation describing data use purposes",
          "Approval records for new or changed purposes",
          "Controls preventing unauthorized secondary use"
        ]
      },
      {
        id: "L25-3.4",
        order: 4,
        name: "L25-3.4 Retention and Destruction Rules",
        summary: "Define and apply retention periods and secure destruction processes for personal information, ensuring information is not retained longer than necessary.",
        key_questions: [
          "Have we defined retention periods for each category of personal information?",
          "Are retention rules aligned with legal, business, and operational requirements?",
          "Do we securely destroy or anonymize personal information once retention periods expire?",
          "Can we demonstrate that retention and destruction rules are actually enforced?"
        ],
        evidence_examples: [
          "Retention and destruction policy",
          "Retention schedule mapped to data categories",
          "Deletion, anonymization, or destruction logs",
          "System configurations enforcing retention limits"
        ]
      }
    ]
  },
  {
    id: "L25-4",
    order: 4,
    name: "Chapter L25-4, Risk Assessment and Privacy Impact Assessments",
    requirements: [
      {
        id: "L25-4.1",
        order: 1,
        name: "L25-4.1 Identification of Privacy Risks",
        summary: "Identify and document privacy risks associated with the collection, use, disclosure, retention, and destruction of personal information, including risks arising from sensitive data and new technologies.",
        key_questions: [
          "Have we identified privacy risks across our data processing activities?",
          "Do we consider risks related to sensitive personal information?",
          "Are risks assessed when introducing new systems, features, or vendors?",
          "Do we reassess risks when processing activities materially change?"
        ],
        evidence_examples: [
          "Privacy risk register",
          "Risk identification workshops or assessments",
          "Change management records referencing privacy risks",
          "Documentation of identified risks linked to systems or processes"
        ]
      },
      {
        id: "L25-4.2",
        order: 2,
        name: "L25-4.2 Conduct of Privacy Impact Assessments",
        summary: "Conduct Privacy Impact Assessments for processing activities that present a high risk to individuals' privacy, in accordance with Law 25 requirements.",
        key_questions: [
          "Do we perform Privacy Impact Assessments for high-risk processing activities?",
          "Are PIAs conducted before deployment or major changes?",
          "Do PIAs cover purpose, necessity, proportionality, and risk mitigation?",
          "Are PIAs reviewed and approved by the appropriate authority?"
        ],
        evidence_examples: [
          "Completed Privacy Impact Assessment reports",
          "PIA templates and methodology",
          "Approval or sign-off records for PIAs",
          "Version history showing PIA updates over time"
        ]
      },
      {
        id: "L25-4.3",
        order: 3,
        name: "L25-4.3 Risk Mitigation and Treatment",
        summary: "Define, implement, and track measures to mitigate identified privacy risks to an acceptable level before or during personal information processing.",
        key_questions: [
          "Have mitigation measures been defined for identified privacy risks?",
          "Are mitigation actions implemented before high-risk processing begins?",
          "Do we track the effectiveness of risk mitigation measures?",
          "Is residual risk explicitly accepted and documented where applicable?"
        ],
        evidence_examples: [
          "Risk treatment or mitigation plans",
          "Implemented technical or organizational controls",
          "Residual risk acceptance records",
          "Follow-up reviews assessing mitigation effectiveness"
        ]
      },
      {
        id: "L25-4.4",
        order: 4,
        name: "L25-4.4 Ongoing Review of Privacy Risks",
        summary: "Ensure privacy risks and impact assessments are reviewed periodically and when significant changes occur, maintaining an up-to-date view of privacy risk exposure.",
        key_questions: [
          "Do we review privacy risks on a regular basis?",
          "Are PIAs updated when systems, data uses, or threat landscapes change?",
          "Do incidents or near misses trigger reassessment of risks?",
          "Is there a defined cadence and ownership for risk reviews?"
        ],
        evidence_examples: [
          "Scheduled risk review records",
          "Updated PIAs reflecting system or process changes",
          "Incident or post-incident review documentation",
          "Governance calendars or review plans"
        ]
      }
    ]
  },
  {
    id: "L25-5",
    order: 5,
    name: "Chapter L25-5, Privacy by Design and Default",
    requirements: [
      {
        id: "L25-5.1",
        order: 1,
        name: "L25-5.1 Integration of Privacy into System and Product Design",
        summary: "Ensure that privacy considerations are integrated into the design and development of systems, products, services, and processes that handle personal information.",
        key_questions: [
          "Do we consider privacy requirements during system and product design?",
          "Are privacy risks assessed before building or deploying new features?",
          "Are design decisions documented with respect to personal information protection?",
          "Do engineering and product teams have clear guidance on privacy expectations?"
        ],
        evidence_examples: [
          "Design review records including privacy considerations",
          "Product or architecture documentation referencing privacy requirements",
          "Engineering guidelines or checklists addressing privacy by design",
          "Records showing involvement of privacy or compliance roles in design reviews"
        ]
      },
      {
        id: "L25-5.2",
        order: 2,
        name: "L25-5.2 Data Minimization by Default",
        summary: "Ensure that systems and processes collect, use, and retain only the personal information necessary to achieve defined purposes, by default.",
        key_questions: [
          "Do our systems limit personal information collection to what is strictly necessary?",
          "Are optional data fields disabled or minimized by default?",
          "Do we periodically review whether collected data remains necessary?",
          "Are logs, analytics, and telemetry included in minimization decisions?"
        ],
        evidence_examples: [
          "System configuration screenshots showing default settings",
          "Data schemas highlighting required versus optional fields",
          "Reviews or audits assessing data minimization practices",
          "Documentation covering minimization of logs and analytics data"
        ]
      },
      {
        id: "L25-5.3",
        order: 3,
        name: "L25-5.3 Privacy-Friendly Default Settings",
        summary: "Configure systems so that the most privacy-protective settings are enabled by default, without requiring user action to reduce data exposure.",
        key_questions: [
          "Are default settings configured to limit visibility, sharing, and retention of personal information?",
          "Do users need to actively opt in to additional data collection or sharing?",
          "Are default configurations reviewed when features or systems change?",
          "Can we demonstrate what the default privacy posture is for our systems?"
        ],
        evidence_examples: [
          "Default configuration documentation or screenshots",
          "Product specifications describing default privacy settings",
          "Change logs showing review of defaults when features evolve",
          "User interface designs illustrating opt-in versus opt-out choices"
        ]
      },
      {
        id: "L25-5.4",
        order: 4,
        name: "L25-5.4 Design Review and Approval Prior to Deployment",
        summary: "Ensure that systems and significant changes affecting personal information are reviewed and approved for privacy compliance before deployment.",
        key_questions: [
          "Do we perform privacy reviews before deploying new systems or major changes?",
          "Is there a defined approval process for privacy-impacting designs?",
          "Are exceptions or deviations documented and approved?",
          "Do deployment decisions consider unresolved privacy risks?"
        ],
        evidence_examples: [
          "Pre-deployment privacy review or checklist",
          "Approval workflows or sign-off records",
          "Exception or deviation records",
          "Release documentation referencing privacy review outcomes"
        ]
      }
    ]
  },
  {
    id: "L25-6",
    order: 6,
    name: "Chapter L25-6, Personal Information Lifecycle Management",
    requirements: [
      {
        id: "L25-6.1",
        order: 1,
        name: "L25-6.1 Inventory and Classification of Personal Information",
        summary: "Maintain an up-to-date inventory of personal information processed by the organization, including classification of sensitive personal information and linkage to systems and purposes.",
        key_questions: [
          "Do we maintain an inventory of personal information across all systems and processes?",
          "Is personal information classified by sensitivity and risk level?",
          "Can we link each data category to its system, owner, and purpose?",
          "Is the inventory reviewed and updated when systems or processing activities change?"
        ],
        evidence_examples: [
          "Personal information inventory or register",
          "Data classification and sensitivity schema",
          "Mapping between data categories, systems, and owners",
          "Inventory review and update records"
        ]
      },
      {
        id: "L25-6.2",
        order: 2,
        name: "L25-6.2 Retention, Archiving, and Secure Storage",
        summary: "Ensure that personal information is retained, archived, and stored securely in accordance with defined retention periods and security requirements.",
        key_questions: [
          "Have retention periods been defined for each category of personal information?",
          "Are retention rules technically enforced where possible?",
          "Is personal information stored securely throughout its lifecycle?",
          "Do backups and archives follow the same retention and protection rules?"
        ],
        evidence_examples: [
          "Retention schedule mapped to personal information categories",
          "System configurations enforcing retention and archiving rules",
          "Storage security documentation or access control policies",
          "Backup and archive management procedures"
        ]
      },
      {
        id: "L25-6.3",
        order: 3,
        name: "L25-6.3 Access Control and Authorized Use",
        summary: "Restrict access to personal information to authorized individuals and systems, ensuring use is consistent with defined purposes and roles.",
        key_questions: [
          "Is access to personal information restricted based on role and necessity?",
          "Are access rights reviewed periodically?",
          "Do we log and monitor access to sensitive personal information?",
          "Are third-party or system accesses governed and documented?"
        ],
        evidence_examples: [
          "Access control policies and role definitions",
          "Access review or recertification records",
          "Audit logs showing access to personal information",
          "Third-party access agreements or system integration documentation"
        ]
      },
      {
        id: "L25-6.4",
        order: 4,
        name: "L25-6.4 Secure Destruction and Anonymization",
        summary: "Ensure personal information is securely destroyed or anonymized when retention periods expire or when information is no longer required for defined purposes.",
        key_questions: [
          "Do we securely destroy or anonymize personal information when it is no longer needed?",
          "Are destruction methods appropriate for the sensitivity of the data?",
          "Can we demonstrate that destruction or anonymization actually occurred?",
          "Are exceptions to destruction documented and approved?"
        ],
        evidence_examples: [
          "Data destruction or anonymization procedures",
          "Deletion or anonymization logs",
          "Certificates of destruction from service providers",
          "Exception or hold records preventing destruction"
        ]
      }
    ]
  },
  {
    id: "L25-7",
    order: 7,
    name: "Chapter L25-7, Consent and Lawful Processing",
    requirements: [
      {
        id: "L25-7.1",
        order: 1,
        name: "L25-7.1 Valid and Informed Consent",
        summary: "Ensure that consent for the collection, use, and disclosure of personal information is clear, free, informed, and given for specific purposes, as required by Law 25.",
        key_questions: [
          "Do we obtain consent in clear and understandable language?",
          "Is consent requested separately for each distinct purpose?",
          "Is consent obtained before or at the time of collection?",
          "Can we demonstrate that consent was freely given and informed?"
        ],
        evidence_examples: [
          "Consent language used in user interfaces or forms",
          "Screenshots or recordings of consent flows",
          "Consent records linked to purposes and timestamps",
          "Reviews or approvals of consent wording"
        ]
      },
      {
        id: "L25-7.2",
        order: 2,
        name: "L25-7.2 Documentation and Traceability of Consent",
        summary: "Maintain records that demonstrate when, how, and for what purposes consent was obtained, ensuring traceability and auditability.",
        key_questions: [
          "Do we log when and how consent was obtained?",
          "Can we link consent records to specific purposes and data categories?",
          "Are consent records retained for an appropriate duration?",
          "Can we retrieve consent records efficiently when required?"
        ],
        evidence_examples: [
          "Consent logs or databases",
          "Audit trails linking consent to user actions",
          "Retention rules for consent records",
          "Sample consent records demonstrating traceability"
        ]
      },
      {
        id: "L25-7.3",
        order: 3,
        name: "L25-7.3 Withdrawal and Modification of Consent",
        summary: "Enable individuals to withdraw or modify their consent easily, and ensure that such changes are respected across systems without undue delay.",
        key_questions: [
          "Can individuals withdraw or modify their consent easily?",
          "Are withdrawal mechanisms as accessible as consent mechanisms?",
          "Do systems honor consent changes across all relevant processing activities?",
          "Are consent withdrawals logged and acted upon in a timely manner?"
        ],
        evidence_examples: [
          "User interface elements for consent withdrawal or preference management",
          "Process documentation describing how withdrawals are handled",
          "Logs showing consent withdrawal events and downstream actions",
          "Testing records verifying withdrawal propagation"
        ]
      },
      {
        id: "L25-7.4",
        order: 4,
        name: "L25-7.4 Processing Without Consent Where Permitted",
        summary: "Document and justify instances where personal information is processed without consent, where permitted by Law 25, ensuring such processing remains limited and lawful.",
        key_questions: [
          "Do we process any personal information without consent under Law 25 exceptions?",
          "Are the legal justifications for such processing documented?",
          "Is non-consensual processing limited to what is strictly necessary?",
          "Are these cases reviewed periodically for continued validity?"
        ],
        evidence_examples: [
          "Legal analysis or justification for processing without consent",
          "Records identifying processing activities relying on exceptions",
          "Internal approvals for non-consensual processing",
          "Periodic review records confirming continued applicability"
        ]
      }
    ]
  },
  {
    id: "L25-8",
    order: 8,
    name: "Chapter L25-8, Individual Rights Management",
    requirements: [
      {
        id: "L25-8.1",
        order: 1,
        name: "L25-8.1 Right of Access and Information",
        summary: "Enable individuals to access their personal information and receive information about how it is used, in accordance with Law 25 requirements.",
        key_questions: [
          "Do we provide a clear mechanism for individuals to request access to their personal information?",
          "Can we identify and retrieve all personal information related to a requesting individual?",
          "Do responses include required information about use, disclosure, and retention?",
          "Are access requests handled within required timelines?"
        ],
        evidence_examples: [
          "Access request intake forms or portals",
          "Procedures for locating and compiling personal information",
          "Response templates used for access requests",
          "Logs showing request receipt and response timelines"
        ]
      },
      {
        id: "L25-8.2",
        order: 2,
        name: "L25-8.2 Right to Rectification",
        summary: "Allow individuals to request correction of inaccurate, incomplete, or outdated personal information, and ensure corrections are applied across relevant systems.",
        key_questions: [
          "Can individuals request correction of their personal information?",
          "Do we verify the accuracy of requested corrections?",
          "Are corrections propagated across all relevant systems and recipients?",
          "Are correction actions documented and auditable?"
        ],
        evidence_examples: [
          "Correction request workflow documentation",
          "Logs showing correction requests and actions taken",
          "System records demonstrating data updates",
          "Notifications sent to third parties where applicable"
        ]
      },
      {
        id: "L25-8.3",
        order: 3,
        name: "L25-8.3 Right to Deletion and De-indexing",
        summary: "Manage requests for deletion or de-indexing of personal information where permitted under Law 25, ensuring lawful and consistent handling.",
        key_questions: [
          "Do we have a process to assess and respond to deletion or de-indexing requests?",
          "Are legal or contractual exceptions to deletion identified and documented?",
          "Can we delete or de-index personal information across systems where required?",
          "Are individuals informed of outcomes and any applicable limitations?"
        ],
        evidence_examples: [
          "Deletion or de-indexing request procedures",
          "Assessment records documenting acceptance or refusal",
          "Deletion or de-indexing logs",
          "Communications sent to individuals regarding outcomes"
        ]
      },
      {
        id: "L25-8.4",
        order: 4,
        name: "L25-8.4 Data Portability",
        summary: "Provide individuals with a copy of their personal information in a structured, commonly used technological format where required by Law 25.",
        key_questions: [
          "Can we provide personal information in a structured and commonly used format?",
          "Do we verify the identity of the requesting individual before providing data?",
          "Are portability requests handled securely?",
          "Are portability requests tracked and completed within required timelines?"
        ],
        evidence_examples: [
          "Data export specifications or schemas",
          "Portability request logs",
          "Identity verification procedures",
          "Examples of exported data files"
        ]
      }
    ]
  },
  {
    id: "L25-9",
    order: 9,
    name: "Chapter L25-9, Automated Decision-Making and Profiling",
    requirements: [
      {
        id: "L25-9.1",
        order: 1,
        name: "L25-9.1 Identification of Automated Decision-Making",
        summary: "Identify systems and processes that use automated decision-making or profiling involving personal information, including AI-driven or rule-based decisions.",
        key_questions: [
          "Do we use automated decision-making or profiling involving personal information?",
          "Which systems, models, or workflows make or support automated decisions?",
          "Do automated decisions produce legal or significant effects on individuals?",
          "Is automated decision-making clearly distinguished from purely assistive tools?"
        ],
        evidence_examples: [
          "Register of automated decision-making systems",
          "System or model documentation describing decision logic",
          "Architecture or data flow diagrams highlighting automation",
          "Internal assessments identifying automated versus assisted decisions"
        ]
      },
      {
        id: "L25-9.2",
        order: 2,
        name: "L25-9.2 Transparency and Notification to Individuals",
        summary: "Inform individuals when personal information is used to make automated decisions about them, as required by Law 25.",
        key_questions: [
          "Are individuals informed when automated decision-making is used?",
          "Is this information provided at or before the time of the decision?",
          "Is the notification clear and understandable?",
          "Do notifications cover the existence and nature of automation?"
        ],
        evidence_examples: [
          "User notices or disclosures related to automated decisions",
          "Screenshots or UI text showing automation notifications",
          "Privacy notice sections addressing automated decision-making",
          "Change logs showing updates to transparency notices"
        ]
      },
      {
        id: "L25-9.3",
        order: 3,
        name: "L25-9.3 Explanation of Automated Decisions",
        summary: "Provide individuals with meaningful information about the logic involved in automated decision-making, at an appropriate level of detail.",
        key_questions: [
          "Can we explain the logic of automated decisions in plain language?",
          "Do explanations avoid exposing sensitive IP while remaining meaningful?",
          "Are explanations tailored to the type and impact of the decision?",
          "Is there a documented process for generating explanations?"
        ],
        evidence_examples: [
          "Explanation templates or standard response language",
          "Internal guidance on explaining automated decisions",
          "Examples of explanations provided to individuals",
          "Reviews validating explanation quality and consistency"
        ]
      },
      {
        id: "L25-9.4",
        order: 4,
        name: "L25-9.4 Human Review and Contestation",
        summary: "Enable individuals to request human review of automated decisions and contest outcomes where applicable.",
        key_questions: [
          "Can individuals request a human review of automated decisions?",
          "Is there a defined process for contesting decisions?",
          "Are human reviewers empowered to change outcomes?",
          "Are review requests and outcomes documented?"
        ],
        evidence_examples: [
          "Human review or escalation procedures",
          "Logs of review and contestation requests",
          "Records showing decision changes following review",
          "Training materials for reviewers handling contestations"
        ]
      }
    ]
  },
  {
    id: "L25-10",
    order: 10,
    name: "Chapter L25-10, Incident and Breach Management",
    requirements: [
      {
        id: "L25-10.1",
        order: 1,
        name: "L25-10.1 Detection and Logging of Privacy Incidents",
        summary: "Establish processes to detect, identify, and log incidents involving personal information, including unauthorized access, use, disclosure, or loss.",
        key_questions: [
          "Do we have mechanisms to detect incidents involving personal information?",
          "Are privacy incidents clearly defined and understood across the organization?",
          "Do we log all privacy incidents, including minor ones?",
          "Are incident records complete and retained appropriately?"
        ],
        evidence_examples: [
          "Incident response or detection procedures",
          "Privacy incident log or register",
          "Security monitoring or alerting outputs",
          "Training materials defining privacy incidents"
        ]
      },
      {
        id: "L25-10.2",
        order: 2,
        name: "L25-10.2 Assessment of Risk of Serious Harm",
        summary: "Assess whether a privacy incident presents a risk of serious harm to individuals, as required by Law 25, and document the assessment.",
        key_questions: [
          "Do we assess the risk of serious harm for each privacy incident?",
          "Are assessment criteria defined and consistently applied?",
          "Is the assessment documented and reviewable?",
          "Do we reassess risk if new information becomes available?"
        ],
        evidence_examples: [
          "Risk of serious harm assessment templates",
          "Completed harm assessments for incidents",
          "Internal guidance defining assessment criteria",
          "Reassessment records where applicable"
        ]
      },
      {
        id: "L25-10.3",
        order: 3,
        name: "L25-10.3 Notification to Authorities and Individuals",
        summary: "Notify the Commission d'acces a l'information and affected individuals when a privacy incident presents a risk of serious harm, in accordance with Law 25 timelines and requirements.",
        key_questions: [
          "Do we notify the regulator when required?",
          "Are affected individuals notified without undue delay?",
          "Do notifications include required information?",
          "Are notification decisions and timelines documented?"
        ],
        evidence_examples: [
          "Notification templates for regulator and individuals",
          "Records of notifications sent",
          "Timeline tracking for incident response",
          "Internal approvals for notification decisions"
        ]
      },
      {
        id: "L25-10.4",
        order: 4,
        name: "L25-10.4 Privacy Incident Register and Follow-Up",
        summary: "Maintain a register of all privacy incidents and ensure follow-up actions are defined, tracked, and completed to prevent recurrence.",
        key_questions: [
          "Do we maintain a register of all privacy incidents?",
          "Are root causes identified and documented?",
          "Are corrective actions defined and tracked?",
          "Do we analyze incident trends over time?"
        ],
        evidence_examples: [
          "Privacy incident register",
          "Root cause analysis or post-incident review reports",
          "Corrective action plans and tracking records",
          "Metrics or reports showing incident trends"
        ]
      }
    ]
  },
  {
    id: "L25-11",
    order: 11,
    name: "Chapter L25-11, Third-Party and Cross-Border Data Transfers",
    requirements: [
      {
        id: "L25-11.1",
        order: 1,
        name: "L25-11.1 Identification of Third Parties Processing Personal Information",
        summary: "Identify and document all third parties that collect, use, store, or otherwise process personal information on behalf of the organization.",
        key_questions: [
          "Do we maintain an inventory of third parties that process personal information?",
          "For each third party, do we know what personal information is shared and for what purpose?",
          "Are responsibilities between the organization and the third party clearly defined?",
          "Is this inventory reviewed when vendors or integrations change?"
        ],
        evidence_examples: [
          "Third-party or vendor inventory",
          "Data flow diagrams showing data sharing with vendors",
          "Documentation describing processing purposes per vendor",
          "Periodic reviews or updates of the vendor inventory"
        ]
      },
      {
        id: "L25-11.2",
        order: 2,
        name: "L25-11.2 Privacy Due Diligence and Contractual Safeguards",
        summary: "Conduct privacy due diligence on third parties and ensure contractual agreements include appropriate safeguards for the protection of personal information.",
        key_questions: [
          "Do we assess the privacy practices of third parties before sharing personal information?",
          "Do contracts include clauses addressing confidentiality, security, and permitted use?",
          "Are vendors required to notify us of privacy incidents?",
          "Are contracts reviewed periodically for continued adequacy?"
        ],
        evidence_examples: [
          "Vendor privacy or risk assessment records",
          "Data processing agreements or contract clauses",
          "Contract review and approval records",
          "Vendor incident notification procedures"
        ]
      },
      {
        id: "L25-11.3",
        order: 3,
        name: "L25-11.3 Cross-Border Transfers of Personal Information",
        summary: "Assess and manage risks associated with transferring personal information outside Quebec, ensuring appropriate safeguards are in place as required by Law 25.",
        key_questions: [
          "Do we transfer personal information outside Quebec?",
          "Have we assessed the privacy risks associated with destination jurisdictions?",
          "Are appropriate safeguards implemented for cross-border transfers?",
          "Are cross-border transfers documented and approved?"
        ],
        evidence_examples: [
          "Cross-border transfer or impact assessments",
          "Jurisdictional risk analyses",
          "Safeguard documentation such as contractual clauses or technical measures",
          "Approval records for cross-border transfers"
        ]
      }
    ]
  },
  {
    id: "L25-12",
    order: 12,
    name: "Chapter L25-12, Training and Awareness",
    requirements: [
      {
        id: "L25-12.1",
        order: 1,
        name: "L25-12.1 Privacy Training for Personnel",
        summary: "Ensure that employees and relevant contractors receive training on personal information protection and their responsibilities under Law 25.",
        key_questions: [
          "Do employees and contractors receive training on Law 25 and privacy obligations?",
          "Is training tailored to roles that handle personal information?",
          "Is training provided on onboarding and refreshed periodically?",
          "Can we demonstrate that training was completed and understood?"
        ],
        evidence_examples: [
          "Privacy training materials or course content",
          "Training attendance or completion records",
          "Onboarding checklists including privacy training",
          "Assessments or quizzes measuring understanding"
        ]
      },
      {
        id: "L25-12.2",
        order: 2,
        name: "L25-12.2 Awareness and Ongoing Communication",
        summary: "Promote ongoing awareness of privacy obligations through regular communication, updates, and reminders related to Law 25.",
        key_questions: [
          "Do we communicate privacy expectations regularly?",
          "Are changes to policies or practices communicated promptly?",
          "Do teams know how to report privacy concerns or incidents?",
          "Is privacy awareness reinforced beyond formal training?"
        ],
        evidence_examples: [
          "Internal communications or announcements on privacy topics",
          "Awareness campaigns or reminders",
          "Documentation describing reporting channels for privacy issues",
          "Metrics tracking engagement with awareness activities"
        ]
      }
    ]
  },
  {
    id: "L25-13",
    order: 13,
    name: "Chapter L25-13, Monitoring, Audit, and Continuous Improvement",
    requirements: [
      {
        id: "L25-13.1",
        order: 1,
        name: "L25-13.1 Monitoring of Law 25 Compliance",
        summary: "Monitor the implementation and effectiveness of controls related to personal information protection to ensure ongoing compliance with Law 25.",
        key_questions: [
          "Do we monitor the implementation of Law 25 controls on an ongoing basis?",
          "Are key compliance indicators defined and tracked?",
          "Do we detect gaps or deviations in a timely manner?",
          "Are monitoring results reported to accountable roles?"
        ],
        evidence_examples: [
          "Compliance dashboards or KPI reports",
          "Control monitoring logs or checklists",
          "Periodic compliance status reports",
          "Records of issues identified through monitoring"
        ]
      },
      {
        id: "L25-13.2",
        order: 2,
        name: "L25-13.2 Internal Audits and Reviews",
        summary: "Conduct periodic internal audits or reviews to assess adherence to Law 25 requirements and the effectiveness of privacy governance practices.",
        key_questions: [
          "Do we perform internal audits or structured reviews of Law 25 compliance?",
          "Are audits independent and objective?",
          "Are findings documented and prioritized?",
          "Are audit results communicated to leadership?"
        ],
        evidence_examples: [
          "Internal audit plans or review schedules",
          "Audit reports or review findings",
          "Evidence supporting audit conclusions",
          "Communications sharing audit outcomes"
        ]
      },
      {
        id: "L25-13.3",
        order: 3,
        name: "L25-13.3 Corrective Actions and Remediation",
        summary: "Define, implement, and track corrective actions to address identified non-compliance, weaknesses, or incidents related to personal information protection.",
        key_questions: [
          "Are corrective actions defined for identified issues?",
          "Are responsibilities and timelines assigned?",
          "Do we track corrective actions to completion?",
          "Is the effectiveness of corrective actions verified?"
        ],
        evidence_examples: [
          "Corrective action or remediation plans",
          "Issue tracking or ticketing records",
          "Closure evidence demonstrating remediation",
          "Verification or follow-up review records"
        ]
      },
      {
        id: "L25-13.4",
        order: 4,
        name: "L25-13.4 Continuous Improvement of Privacy Practices",
        summary: "Continuously improve privacy governance, controls, and practices based on monitoring results, audits, incidents, and organizational changes.",
        key_questions: [
          "Do we use lessons learned to improve privacy practices?",
          "Are improvements prioritized based on risk and impact?",
          "Do changes in technology, products, or regulations trigger improvements?",
          "Is continuous improvement embedded into governance processes?"
        ],
        evidence_examples: [
          "Improvement plans or roadmaps",
          "Records showing changes made following audits or incidents",
          "Governance meeting notes discussing improvements",
          "Updated policies, procedures, or controls reflecting improvements"
        ]
      }
    ]
  }
];
