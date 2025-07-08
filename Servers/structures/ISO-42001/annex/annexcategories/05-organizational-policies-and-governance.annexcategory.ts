import { AnnexCategoryISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryStructISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryStructISO.model";

export const OrganizationalPoliciesAndGovernance: Partial<
  AnnexCategoryStructISO & AnnexCategoryISO
>[] = [
  {
    sub_id: 1.1,
    order_no: 1,
    title: "Policies for AI",
    description: "Management direction and support for AI via policies.",
    guidance:
      "Management should define and endorse a set of policies to provide clear direction and support for AI development and use within the organization, aligned with business objectives and relevant regulations/ethics.",
    is_applicable: true,
    implementation_description:
      "Management has formalized AI policies aligned with industry regulations and ethical guidelines.",
    auditor_feedback:
      "Policies are adequate but require periodic updates reflecting regulatory changes.",
  },
  {
    sub_id: 2.1,
    order_no: 2,
    title: "AI governance framework",
    description: "Establishment of a governance structure for AI oversight.",
    guidance:
      "An AI governance framework, including roles, responsibilities, processes, and oversight mechanisms, should be established and maintained to direct and control the organization’s AI-related activities.",
    is_applicable: true,
    implementation_description:
      "A governance structure with defined roles and oversight committees has been established.",
    auditor_feedback: "Framework is robust; recommend more frequent audits.",
  },
  {
    sub_id: 3.1,
    order_no: 3,
    title: "AI roles and responsibilities",
    description: "Defining and allocating AI responsibilities.",
    guidance:
      "All AI system related responsibilities should be defined and allocated.",
    is_applicable: true,
    implementation_description:
      "All AI roles are documented with clear accountability matrices.",
    auditor_feedback: "Role definitions are clear and well communicated.",
  },
  {
    sub_id: 3.2,
    order_no: 4,
    title: "Segregation of duties",
    description: "Separating conflicting duties related to AI.",
    guidance:
      "Conflicting duties and areas of responsibility should be segregated.",
    is_applicable: false,
    justification_for_exclusion:
      "Small team size limits segregation of duties without significant resource burden.",
    implementation_description: "",
    auditor_feedback:
      "Segregation is currently limited; recommend revisiting as the team grows.",
  },
  {
    sub_id: 4.1,
    order_no: 5,
    title: "Accountability for AI systems",
    description: "Assigning accountability for AI systems.",
    guidance:
      "Accountability should be assigned for the establishment, implementation, maintenance, monitoring, evaluation and improvement of the AIMS and for AI systems throughout their lifecycle.",
    is_applicable: true,
    implementation_description:
      "Accountability assigned to AI project managers and system owners across lifecycle.",
    auditor_feedback: "Good accountability tracking observed.",
  },
  {
    sub_id: 5.1,
    order_no: 6,
    title: "Contact with authorities",
    description: "Maintaining contact with relevant authorities.",
    guidance:
      "Appropriate contacts with relevant authorities should be maintained.",
    is_applicable: true,
    implementation_description:
      "Regular communications maintained with regulatory bodies regarding AI compliance.",
    auditor_feedback: "Effective liaison with authorities.",
  },
  {
    sub_id: 5.2,
    order_no: 7,
    title: "Contact with special interest groups",
    description: "Maintaining contact with special interest groups.",
    guidance:
      "Appropriate contacts with special interest groups and other specialist forums and professional associations should be maintained.",
    is_applicable: false,
    justification_for_exclusion:
      "Organization has no active membership in AI special interest groups currently.",
    implementation_description: "",
    auditor_feedback: "No engagement noted; monitor for future opportunities.",
  },
  {
    sub_id: 6.1,
    order_no: 8,
    title: "AI in project management",
    description: "Integrating AI aspects into project management.",
    guidance:
      "AI should be integrated into the organization''s project management.",
    is_applicable: true,
    implementation_description:
      "AI considerations integrated into project planning and risk management frameworks.",
    auditor_feedback: "AI aspects are well embedded in projects.",
  },
];
