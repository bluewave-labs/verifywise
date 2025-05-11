import { AnnexCategoryStructISO } from "../../../../models/ISO-42001/annexCategoryStructISO.model";

export const DataForAISystems: AnnexCategoryStructISO[] = [
  {
    sub_id: 1.1,
    order_no: 1,
    title: "Data quality for AI systems",
    description: "Processes to ensure data quality characteristics.",
    guidance: "Processes should be implemented to ensure that data used for developing and operating AI systems meets defined quality criteria relevant to its intended use (e.g., accuracy, completeness, timeliness, relevance, representativeness)."
  },
  {
    sub_id: 2.1,
    order_no: 2,
    title: "Data acquisition",
    description: "Managing the acquisition of data for AI.",
    guidance: "Data acquisition processes should ensure data is obtained legally, ethically, and according to specified requirements."
  },
  {
    sub_id: 3.1,
    order_no: 3,
    title: "Data preparation",
    description: "Preparing data for use in AI systems.",
    guidance: "Data should be prepared (cleaned, transformed, annotated) suitable for its intended use in AI system development and operation."
  },
  {
    sub_id: 4.1,
    order_no: 4,
    title: "Data provenance",
    description: "Documenting the origin and history of data.",
    guidance: "Information about the origin, history, and processing steps applied to data (provenance) should be documented and maintained."
  },
  {
    sub_id: 5.1,
    order_no: 5,
    title: "Data privacy",
    description: "Protecting privacy in data used for AI.",
    guidance: "Privacy requirements should be addressed throughout the data lifecycle, including anonymization or pseudonymization where appropriate."
  },
  {
    sub_id: 6.1,
    order_no: 6,
    title: "Data handling",
    description: "Securely handling data throughout its lifecycle.",
    guidance: "Data should be handled securely, including storage, access control, transmission, and disposal, according to its classification and applicable requirements."
  }
]