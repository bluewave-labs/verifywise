import { SubClauseISO } from "../../../../domain.layer/frameworks/ISO-42001/subClauseISO.model";
import { SubClauseStructISO } from "../../../../domain.layer/frameworks/ISO-42001/subClauseStructISO.model";

export const Leadership: Partial<SubClauseStructISO & SubClauseISO>[] = [
  {
    title: "Leadership and commitment",
    order_no: 1,
    summary:
      "Top management must demonstrate leadership by ensuring policy/objectives alignment, resource availability, integration, communication, and promoting improvement.",
    questions: [
      "How does top management show active involvement and support for the AIMS?",
      "Are AIMS objectives aligned with strategic goals?",
      "Are sufficient resources allocated?",
      "Is the importance of AI governance communicated effectively?",
      "How are ethical considerations promoted by leadership?",
    ],
    evidence_examples: [
      "Management meeting minutes discussing AIMS",
      "Resource allocation records (budget, staffing)",
      "Internal communications from leadership",
      "Published AI Policy signed by management",
    ],
    implementation_description:
      "Top management holds quarterly AIMS governance meetings, approves AI policy, and allocates resources through annual planning cycles.",
    auditor_feedback:
      "Leadership shows commitment through regular reviews and strategic alignment; however, ethical leadership training could be expanded.",
  },
  {
    title: "Policy",
    order_no: 2,
    summary:
      "Establish, communicate, and maintain an AI Policy appropriate to the organization''s context.",
    questions: [
      "Is there a documented AI Policy?",
      "Does it include commitments to requirements and continual improvement?",
      "Does it align with organizational AI principles/ethics?",
      "Is it communicated and understood by relevant personnel?",
      "Is it available to relevant interested parties?",
    ],
    evidence_examples: [
      "The documented AI Policy",
      "Communication records (emails, intranet posts)",
      "Training materials covering the policy",
    ],
    implementation_description:
      "The organization has a signed AI Policy, published on the intranet and included in employee onboarding sessions.",
    auditor_feedback:
      "Policy is well-documented and aligned with ethical AI principles. Consider translating it into more languages for broader accessibility.",
  },
  {
    title: "Organizational roles, responsibilities, and authorities",
    order_no: 3,
    summary:
      "Assign and communicate responsibilities and authorities for roles relevant to the AIMS.",
    questions: [
      "Who is ultimately accountable for the AIMS?",
      "Who is responsible for specific AIMS tasks (risk assessment, control implementation, audits, reporting)?",
      "Are these roles, responsibilities, and authorities documented and communicated?",
    ],
    evidence_examples: [
      "Organization chart showing AIMS roles",
      "Documented role descriptions",
      "Responsibility Assignment Matrix (RACI)",
    ],
    implementation_description:
      "Roles and responsibilities for AIMS are defined in a RACI matrix and communicated via department meetings and intranet postings.",
    auditor_feedback:
      "Role clarity is strong, with good documentation. Future audits should verify if responsibilities are consistently understood at all levels.",
  },
];
