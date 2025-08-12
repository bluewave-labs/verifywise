export const ISO27001Clause = [
  {
    arrangement: 4,
    title: "Context of the organization",
    subclauses: [
      {
        arrangement: 4,
        index: 1,
        title: "Understanding the organization and its context",
        requirement_summary:
          "Identify what internal and external factors affect how your company manages information security.",
        key_questions: [
          "What business goals or challenges impact our information security?",
          "Which external factors, such as laws, suppliers, or technology trends, change how we protect data?",
          "Do these factors affect decisions about risk and security measures?",
        ],
        evidence_examples: [
          "Context analysis document",
          "SWOT or PESTLE analysis",
          "Meeting notes or planning documents",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 4,
            order_no: 1,
            clause_title: "Understanding the organization and its context",
            relevance: "Medium",
          },
        ],
      },
      {
        arrangement: 4,
        index: 2,
        title: "Understanding the needs and expectations of interested parties",
        requirement_summary:
          "List all people and organizations who care about how we manage information security and note their requirements.",
        key_questions: [
          "Who are our stakeholders, such as customers, regulators, partners, and suppliers?",
          "What specific security requirements or expectations do they have?",
        ],
        evidence_examples: [
          "Stakeholder list",
          "Contracts or SLAs mentioning security",
          "Customer requirement tracking sheet",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 5,
            order_no: 2,
            clause_title: "Policy",
            relevance: "Medium",
          },
        ],
      },
      {
        arrangement: 4,
        index: 3,
        title: "Determining the scope of the ISMS",
        requirement_summary:
          "Define exactly what parts of the company are covered by ISO 27001 and why others might be excluded.",
        key_questions: [
          "What systems, locations, and processes are included in our ISMS scope?",
          "Are exclusions documented and justified?",
        ],
        evidence_examples: [
          "Scope statement",
          "ISMS boundaries document",
          "Exclusion list with rationale",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 2,
            clause_title: "AI risk assessment (Operational)",
            relevance: "High",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 3,
            clause_title: "AI risk treatment (Operational)",
            relevance: "High",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 4,
            clause_title: "AI System Lifecycle",
            relevance: "High",
          },
        ],
      },
      {
        arrangement: 4,
        index: 4,
        title: "Information Security Management System",
        requirement_summary:
          "Create and maintain a structured approach to managing information security across the organization.",
        key_questions: [
          "Do we have a defined ISMS process?",
          "Does it include continuous improvement steps?",
        ],
        evidence_examples: [
          "ISMS process documentation",
          "Improvement plans",
          "Tracking reports for ISMS activities",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 5,
            order_no: 2,
            clause_title: "Policy",
            relevance: "Medium",
          },
        ],
      }
    ]
  },
  {
    arrangement: 5,
    title: "Leadership",
    subclauses: [
      {
        arrangement: 5,
        index: 1,
        title: "Leadership and commitment",
        requirement_summary:
          "Ensure company leaders actively support and drive information security initiatives.",
        key_questions: [
          "Are managers setting priorities for security?",
          "Do they allocate enough resources to security?",
        ],
        evidence_examples: [
          "Meeting minutes showing leadership involvement",
          "Budget and resource allocation documents",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 5,
            order_no: 2,
            clause_title: "Policy",
            relevance: "Medium",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 2,
            clause_title: "AI risk assessment (Operational)",
            relevance: "High",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 3,
            clause_title: "AI risk treatment (Operational)",
            relevance: "High",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 4,
            clause_title: "AI System Lifecycle",
            relevance: "High",
          },
        ],
      },
      {
        arrangement: 5,
        index: 2,
        title: "Information security policy",
        requirement_summary:
          "Create a clear, approved policy outlining your information security goals and rules.",
        key_questions: [
          "Do we have a signed and approved security policy?",
          "Has the policy been communicated to all relevant staff?",
        ],
        evidence_examples: [
          "Policy document",
          "Communication records or intranet posts",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 4,
            order_no: 1,
            clause_title: "Understanding the organization and its context",
            relevance: "Medium",
          },
        ],
      },
      {
        arrangement: 5,
        index: 3,
        title: "Organizational roles, responsibilities, and authorities",
        requirement_summary:
          "Make sure all employees know their security responsibilities and who is accountable for key decisions.",
        key_questions: [
          "Are security roles and responsibilities defined in job descriptions?",
          "Do staff know whom to contact for security issues?",
        ],
        evidence_examples: [
          "Organizational chart",
          "Responsibility matrix",
          "Job description documents",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 5,
            order_no: 2,
            clause_title: "Policy",
            relevance: "Medium",
          },
        ],
      }
    ]
  },
  {
    arrangement: 6,
    title: "Planning",
    subclauses: [
      {
        arrangement: 6,
        index: 1,
        sub_index: 2,
        title: "Information security risk assessment",
        requirement_summary:
          "Have a clear method to identify, assess, and prioritize information security risks regularly.",
        key_questions: [
          "Do we follow a documented process for spotting risks?",
          "Are risk levels (high, medium, low) defined clearly?",
          "Do we update the risk register regularly?",
        ],
        evidence_examples: [
          "Risk assessment methodology",
          "Risk register",
          "Recent risk assessment reports",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
      {
        arrangement: 6,
        index: 1,
        sub_index: 3,
        title: "Information security risk treatment",
        requirement_summary:
          "Develop and track actions to manage risks with appropriate controls and treatments.",
        key_questions: [
          "Do we have treatment plans for significant risks?",
          "Are chosen controls linked to risk priorities and documented?",
        ],
        evidence_examples: [
          "Risk treatment plans",
          "Control selection documents",
          "Approval records",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
      {
        arrangement: 6,
        index: 2,
        title: "Information security objectives",
        requirement_summary:
          "Define measurable security goals and plan actions to achieve them.",
        key_questions: [
          "Are our information security objectives written down?",
          "Are they reviewed and updated periodically?",
        ],
        evidence_examples: [
          "Objectives document",
          "Review meeting notes",
          "Progress reports",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 5,
            order_no: 2,
            clause_title: "Policy",
            relevance: "Medium",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 2,
            clause_title: "AI risk assessment (Operational)",
            relevance: "High",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 3,
            clause_title: "AI risk treatment (Operational)",
            relevance: "High",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 4,
            clause_title: "AI System Lifecycle",
            relevance: "High",
          },
        ],
      }
    ]
  },
  {
    arrangement: 7,
    title: "Support",
    subclauses: [
      {
        arrangement: 7,
        index: 1,
        title: "Resources",
        requirement_summary:
          "Make sure enough staff, tools, and funding are available to maintain the ISMS.",
        key_questions: [
          "Do we have sufficient resources allocated to ISMS tasks?",
          "Are tools and infrastructure adequate for security requirements?",
        ],
        evidence_examples: [
          "Resource allocation plan",
          "Budget approvals",
          "Tool purchase records",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 5,
            order_no: 2,
            clause_title: "Policy",
            relevance: "Medium",
          },
        ],
      },
      {
        arrangement: 7,
        index: 2,
        title: "Competence",
        requirement_summary:
          "Ensure employees have the necessary skills and training for their security-related tasks.",
        key_questions: [
          "Have we identified required competencies for security roles?",
          "Do we offer relevant training or certifications?",
        ],
        evidence_examples: [
          "Training matrix",
          "Employee certifications",
          "Skill assessment records",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 4,
            order_no: 1,
            clause_title: "Understanding the organization and its context",
            relevance: "Medium",
          },
        ],
      },
      {
        arrangement: 7,
        index: 3,
        title: "Awareness",
        requirement_summary:
          "Employees must understand security policies and their responsibilities in protecting information.",
        key_questions: [
          "Have all employees received security awareness training?",
          "Do they know how to report incidents?",
        ],
        evidence_examples: [
          "Training attendance records",
          "Awareness posters or guides",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 5,
            order_no: 2,
            clause_title: "Policy",
            relevance: "Medium",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 2,
            clause_title: "AI risk assessment (Operational)",
            relevance: "High",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 3,
            clause_title: "AI risk treatment (Operational)",
            relevance: "High",
          },
          {
            framework: "ISO 42001",
            clause_no: 8,
            order_no: 4,
            clause_title: "AI System Lifecycle",
            relevance: "High",
          },
        ],
      },
      {
        arrangement: 7,
        index: 4,
        title: "Communication",
        requirement_summary:
          "Share security-related information effectively inside and outside the company.",
        key_questions: [
          "Do we have a communication plan for security messages?",
          "Do we inform stakeholders about incidents promptly?",
        ],
        evidence_examples: [
          "Communication plan",
          "Incident notification logs",
          "Emails to stakeholders",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [
          {
            framework: "ISO 42001",
            clause_no: 4,
            order_no: 1,
            clause_title: "Understanding the organization and its context",
            relevance: "Medium",
          },
        ],
      },
      {
        arrangement: 7,
        index: 5,
        title: "Documented information",
        requirement_summary:
          "Keep necessary ISMS documents and records under control and easily accessible.",
        key_questions: [
          "Do we version-control security documents?",
          "Are sensitive records protected properly?",
        ],
        evidence_examples: [
          "Document register",
          "Access-controlled folders",
          "Record logs",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
    ]
  },
  {
    arrangement: 8,
    title: "Operation",
    subclauses: [
      {
        arrangement: 8,
        index: 1,
        title: "Operational planning and control",
        requirement_summary:
          "Plan and manage day-to-day operations to meet security goals and apply risk treatments effectively.",
        key_questions: [
          "Do we have documented procedures for operational tasks?",
          "Are controls applied consistently?",
        ],
        evidence_examples: [
          "Operational plans",
          "Checklists or logs of daily security checks",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
      {
        arrangement: 8,
        index: 2,
        title: "Risk assessment during operations",
        requirement_summary:
          "Review risks when projects change, new systems are introduced, or major updates occur.",
        key_questions: [
          "Do we assess risks for all major changes?",
          "Are decisions documented based on updated risk findings?",
        ],
        evidence_examples: ["Change risk logs", "Updated risk register entries"],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
      {
        arrangement: 8,
        index: 3,
        title: "Risk treatment during operations",
        requirement_summary:
          "Implement planned risk treatment actions and verify they are effective.",
        key_questions: [
          "Do we track results of risk treatments?",
          "Are failed treatments escalated quickly?",
        ],
        evidence_examples: ["Risk treatment reports", "Incident follow-up records"],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
    ]
  },
  {
    arrangement: 9,
    title: "Performance evaluation",
    subclauses: [
      {
        arrangement: 9,
        index: 1,
        title: "Monitoring, measurement, analysis, and evaluation",
        requirement_summary:
          "Track and measure the performance of ISMS processes and security controls.",
        key_questions: [
          "Do we have defined KPIs for security?",
          "Are results reviewed periodically?",
        ],
        evidence_examples: ["Monitoring reports", "Performance dashboards"],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
      {
        arrangement: 9,
        index: 2,
        title: "Internal audit",
        requirement_summary:
          "Check regularly that ISMS is effective and meets ISO 27001 requirements.",
        key_questions: [
          "Is there a documented audit plan?",
          "Are findings recorded and resolved promptly?",
        ],
        evidence_examples: [
          "Audit schedules",
          "Audit reports",
          "Corrective action tracking logs",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
      {
        arrangement: 9,
        index: 3,
        title: "Management review",
        requirement_summary:
          "Have top management review ISMS performance and plan necessary improvements.",
        key_questions: [
          "Are reviews held regularly with documented outputs?",
          "Are improvement decisions tracked and implemented?",
        ],
        evidence_examples: ["Meeting minutes", "Improvement action logs"],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
    ]
  },
  {
    arrangement: 10,
    title: "Improvement",
    subclauses: [
      {
        arrangement: 10,
        index: 1,
        title: "Nonconformity and corrective action",
        requirement_summary:
          "Record, investigate, and fix problems, ensuring they do not recur.",
        key_questions: [
          "Do we track nonconformities in a register?",
          "Are corrective actions tested and verified?",
        ],
        evidence_examples: [
          "Nonconformity logs",
          "Corrective action plans",
          "Verification records",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
      {
        arrangement: 10,
        index: 2,
        title: "Continual improvement",
        requirement_summary:
          "Identify and act on opportunities to make the ISMS more effective over time.",
        key_questions: [
          "Do we have a process for suggesting and implementing improvements?",
          "Are improvements reviewed by leadership?",
        ],
        evidence_examples: [
          "Improvement plan document",
          "Lessons learned reports",
          "Approval records",
        ],
        implementation_description: "",
        status: "",
        owner: "",
        reviewer: "",
        approver: "",
        due_date: "",
        cross_mappings: [],
      },
    ]
  }
];
