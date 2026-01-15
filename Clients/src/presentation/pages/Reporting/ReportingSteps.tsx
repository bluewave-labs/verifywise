import { FileText } from "lucide-react";
import { IPageTourStep } from "../../types/interfaces/i.tour";

const ReportingSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="generate-report-button"]',
    content: {
      header: "Generate reports",
      body: "Create detailed compliance reports for your AI projects. Include framework assessments, risk summaries, and evidence documentation for audits and stakeholder reviews.",
      icon: <FileText size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default ReportingSteps;
