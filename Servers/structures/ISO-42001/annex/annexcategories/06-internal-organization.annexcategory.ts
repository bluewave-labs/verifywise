import { AnnexCategoryISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryStructISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryStructISO.model";

export const InternalOrganization: Partial<
  AnnexCategoryStructISO & AnnexCategoryISO
>[] = [
  {
    sub_id: 1.1,
    order_no: 1,
    title: "AI roles and responsibilities",
    description: "Defining and allocating AI responsibilities.",
    guidance:
      "All responsibilities related to the development, deployment, operation, and governance of AI systems should be clearly defined and allocated.",
    is_applicable: true,
    implementation_description:
      "Internal roles for AI development, deployment, and governance are clearly defined.",
    auditor_feedback: "Clear role delineation enhances accountability.",
  },
  {
    sub_id: 1.2,
    order_no: 2,
    title: "Segregation of duties",
    description: "Separating conflicting duties related to AI.",
    guidance:
      "Conflicting duties and areas of responsibility should be segregated to reduce opportunities for unauthorized or unintentional modification or misuse of AI systems or related assets.",
    is_applicable: true,
    implementation_description:
      "Segregation implemented to reduce risks of unauthorized AI system modifications.",
    auditor_feedback: "Controls for segregation are effective.",
  },
];
