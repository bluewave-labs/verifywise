import { SubClauseISO } from "../../../../domain.layer/frameworks/ISO-42001/subClauseISO.model";
import { SubClauseStructISO } from "../../../../domain.layer/frameworks/ISO-42001/subClauseStructISO.model";

export const Planning: Partial<SubClauseStructISO & SubClauseISO>[] = [
  {
    title:
      "Actions to address risks and opportunities (Includes Risk Assessment, Treatment, Impact Assessment)",
    order_no: 1,
    summary:
      "Plan actions based on context, stakeholders, risks, and opportunities. Conduct AI risk assessments, plan risk treatments, and assess AI system impacts.",
    questions: [
      "Do we have a process for identifying risks and opportunities related to the AIMS?",
      "Is there a defined AI risk assessment methodology?",
      "Are risks related to AI systems (bias, fairness, transparency, security, societal impact etc.) systematically identified and assessed?",
      "Is there a process for selecting risk treatment options and controls?",
      "Is a Statement of Applicability (SoA) maintained?",
      "Do we assess the potential positive and negative impacts of our AI systems on individuals and society?",
      "How are risk assessment and impact assessment results used in planning?",
    ],
    evidence_examples: [
      "Risk management framework/policy/procedure",
      "AI Risk Assessment Methodology",
      "Risk assessment reports per AI system",
      "AI Risk Register",
      "AI Risk Treatment Plan",
      "Statement of Applicability (SoA)",
      "AI Impact Assessment Methodology",
      "AI Impact Assessment reports",
    ],
    implementation_description:
      "The organization uses a documented AI risk assessment and impact assessment methodology, reviewed annually, with outputs stored in a central risk register and treatment plan.",
    auditor_feedback:
      "Comprehensive risk framework in place. Suggest improving traceability between specific AI systems and their associated risks and treatments.",
  },
  {
    title: "AI objectives and planning to achieve them",
    order_no: 2,
    summary:
      "Establish measurable AIMS objectives aligned with the AI policy and plan how to achieve them.",
    questions: [
      "What are the specific, measurable objectives for our AIMS?",
      "Are they consistent with the AI policy and organizational goals?",
      "What actions, resources, responsibilities, and timelines are defined to achieve these objectives?",
      "How will the achievement of objectives be evaluated?",
    ],
    evidence_examples: [
      "Documented AIMS Objectives",
      "Action plans linked to objectives",
      "Performance indicators (KPIs) for objectives",
      "Management review records discussing objectives progress",
    ],
    implementation_description:
      "Measurable AIMS objectives are defined annually, aligned with the AI policy, and tracked using KPIs reviewed in monthly management meetings.",
    auditor_feedback:
      "Objectives are clear and measurable. Evidence of consistent tracking found. Consider formalizing responsibility assignments for each objective.",
  },
];
