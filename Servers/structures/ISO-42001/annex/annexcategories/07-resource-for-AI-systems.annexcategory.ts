import { AnnexCategoryStructISO } from "../../../../models/ISO-42001/annexCategoryStructISO.model";

export const ResourcesForAISystems: AnnexCategoryStructISO[] = [
  {
    sub_id: 1.1,
    order_no: 1,
    title: "Identification of resources",
    description: "Identifying resources needed for AI.",
    guidance: "Resources necessary for the development, operation, and maintenance of AI systems, including data, knowledge, processes, systems, computing power, and human expertise, should be identified and managed."
  },
  {
    sub_id: 2.1,
    order_no: 2,
    title: "Computational resources",
    description: "Managing computational resources for AI.",
    guidance: "Computational resources required for AI systems should be managed throughout their lifecycle."
  },
  {
    sub_id: 3.1,
    order_no: 3,
    title: "Data resources",
    description: "Managing data resources for AI.",
    guidance: "Data resources required for AI systems should be managed throughout their lifecycle."
  },
  {
    sub_id: 4.1,
    order_no: 4,
    title: "System resources",
    description: "Managing system resources for AI.",
    guidance: "System resources required for AI systems, including tools and infrastructure, should be managed throughout their lifecycle."
  },
  {
    sub_id: 5.1,
    order_no: 5,
    title: "Human resources",
    description: "Managing human resources for AI.",
    guidance: "Human resources required for AI systems, including roles, competencies, and training, should be managed throughout their lifecycle."
  }
]