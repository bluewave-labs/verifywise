import { AnnexCategoryISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryStructISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryStructISO.model";

export const DataForAISystems: Partial<
  AnnexCategoryStructISO & AnnexCategoryISO
>[] = [
  {
    sub_id: 1.1,
    order_no: 1,
    title: "Data quality for AI systems",
    description: "Processes to ensure data quality characteristics.",
    guidance:
      "Processes should be implemented to ensure that data used for developing and operating AI systems meets defined quality criteria relevant to its intended use (e.g., accuracy, completeness, timeliness, relevance, representativeness).",
    is_applicable: true,
    implementation_description:
      "Processes ensure data accuracy, completeness, and timeliness aligned with AI use cases.",
    auditor_feedback: "Data quality controls are well implemented.",
  },
  {
    sub_id: 2.1,
    order_no: 2,
    title: "Data acquisition",
    description: "Managing the acquisition of data for AI.",
    guidance:
      "Data acquisition processes should ensure data is obtained legally, ethically, and according to specified requirements.",
    is_applicable: true,
    implementation_description:
      "Data acquisition complies with legal and ethical standards with documented approval.",
    auditor_feedback:
      "Data acquisition processes meet regulatory requirements.",
  },
  {
    sub_id: 3.1,
    order_no: 3,
    title: "Data preparation",
    description: "Preparing data for use in AI systems.",
    guidance:
      "Data should be prepared (cleaned, transformed, annotated) suitable for its intended use in AI system development and operation.",
    is_applicable: true,
    implementation_description:
      "Data is cleaned, annotated, and transformed per model requirements.",
    auditor_feedback: "Preparation methods are appropriate and consistent.",
  },
  {
    sub_id: 4.1,
    order_no: 4,
    title: "Data provenance",
    description: "Documenting the origin and history of data.",
    guidance:
      "Information about the origin, history, and processing steps applied to data (provenance) should be documented and maintained.",
    is_applicable: true,
    implementation_description:
      "Automated lineage tracking tools document data origin and transformation steps.",
    auditor_feedback: "Provenance documentation is comprehensive.",
  },
  {
    sub_id: 5.1,
    order_no: 5,
    title: "Data privacy",
    description: "Protecting privacy in data used for AI.",
    guidance:
      "Privacy requirements should be addressed throughout the data lifecycle, including anonymization or pseudonymization where appropriate.",
    is_applicable: true,
    implementation_description:
      "Privacy controls include anonymization and pseudonymization compliant with GDPR.",
    auditor_feedback: "Privacy protection measures are effective.",
  },
  {
    sub_id: 6.1,
    order_no: 6,
    title: "Data handling",
    description: "Securely handling data throughout its lifecycle.",
    guidance:
      "Data should be handled securely, including storage, access control, transmission, and disposal, according to its classification and applicable requirements.",
    is_applicable: true,
    implementation_description:
      "Data is securely stored, accessed, transmitted, and disposed per classification.",
    auditor_feedback: "Secure data handling procedures are in place.",
  },
];
