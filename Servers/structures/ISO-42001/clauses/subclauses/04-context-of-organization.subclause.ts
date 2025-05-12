import { SubClauseStructISO } from "../../../../models/ISO-42001/subClauseStructISO.model";

export const ContextOfOrganization: SubClauseStructISO[] = [
  {
    title: "Understanding the organization and its context",
    order_no: 1,
    summary:
      "Determine external and internal issues relevant to the organization''s purpose and its AIMS, including AI principles/values and strategic direction.",
    questions: [
      "What internal factors (culture, resources, knowledge) influence our AIMS?",
      "What external factors (legal, ethical, market, social, technological) influence our AIMS?",
      "How does our use/development of AI align with our business strategy?",
      "What are our organization''s guiding principles or values related to AI?"
    ],
    evidence_examples: [
      "Context analysis document (PESTLE, SWOT focused on AI)",
      "Documentation of internal/external issues",
      "Strategic planning documents referencing AI",
      "Documented AI Principles/Ethics Statement"
    ]
  },
  {
    title: "Understanding the needs and expectations of interested parties",
    order_no: 2,
    summary: "Identify interested parties relevant to the AIMS and their requirements/expectations concerning AI.",
    questions: [
      "Who are the interested parties for our AI systems (customers, users, regulators, employees, public, partners)?",
      "What are their relevant needs, expectations, and requirements (legal, ethical, contractual) regarding our AI?",
      "How do we capture and review these requirements?"
    ],
    evidence_examples: [
      "Stakeholder analysis matrix/register",
      "List of applicable legal/regulatory requirements for AI",
      "Records of communication with stakeholders",
      "Contractual requirements related to AI"
    ]
  },
  {
    title: "Determining the scope of the AI Management System",
    order_no: 3,
    summary: "Define the boundaries and applicability of the AIMS within the organization.",
    questions: [
      "What organizational units, processes, locations are included in the AIMS?",
      "Which specific AI systems or applications are covered by the AIMS?",
      "What stages of the AI lifecycle are included?",
      "Are there any exclusions, and what is the justification?"
    ],
    evidence_examples: [
      "Documented AIMS Scope Statement"
    ]
  },
  {
    title: "AI Management System",
    order_no: 4,
    summary: "Establish, implement, maintain, and continually improve the AIMS in accordance with ISO 42001 requirements.",
    questions: [
      "Do we have the necessary processes and documentation established for the AIMS?",
      "Are these processes being followed (implemented)?",
      "Are there mechanisms for maintaining and updating the AIMS?",
      "Is there a process for continual improvement of the AIMS?"
    ],
    evidence_examples: [
      "The AIMS documentation itself (policies, procedures)",
      "Records of implementation activities",
      "Management review records",
      "Audit results"
    ]
  }
]