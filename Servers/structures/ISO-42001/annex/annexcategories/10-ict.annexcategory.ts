import { AnnexCategoryStructISO } from "../../../../models/ISO-42001/annexCategoryStructISO.model";

export const ICT: AnnexCategoryStructISO[] = [
  {
    sub_id: 1.1,
    order_no: 1,
    title: "Information security for AI systems",
    description: "Application of information security controls to AI systems.",
    guidance: "Information security requirements and controls (potentially leveraging standards like ISO/IEC 27001) should be applied throughout the AI system lifecycle to protect confidentiality, integrity, and availability."
  },
  {
    sub_id: 2.1,
    order_no: 2,
    title: "Security of AI models",
    description: "Protecting AI models from threats.",
    guidance: "AI models should be protected against threats such as unauthorized access, modification, theft, or poisoning."
  },
  {
    sub_id: 3.1,
    order_no: 3,
    title: "Security of AI data",
    description: "Protecting data used by AI systems.",
    guidance: "Data used in AI systems should be protected according to information security policies and data classification."
  },
  {
    sub_id: 4.1,
    order_no: 4,
    title: "Resilience of AI systems",
    description: "Ensuring AI systems are resilient to failures and attacks.",
    guidance: "AI systems should be designed and operated to be resilient against failures, errors, and attacks."
  }
]