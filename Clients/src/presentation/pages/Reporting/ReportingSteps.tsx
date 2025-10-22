import { PageTourStep } from "../../components/PageTour";
import { FileText, Building2, Filter } from "lucide-react";

const ReportingSteps: PageTourStep[] = [
  {
    target: '[data-joyride-id="generate-project-report-button"]',
    content: {
      header: "Generate project report",
      body: "Create detailed compliance reports for individual AI projects. Include framework assessments, risk summaries, and evidence documentation.",
      icon: <FileText size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="generate-organization-report-button"]',
    content: {
      header: "Generate organization report",
      body: "Generate comprehensive organization-wide governance reports covering all frameworks, policies, and compliance status across your AI program.",
      icon: <Building2 size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="report-filter"]',
    content: {
      header: "Filter reports",
      body: "Filter the report archive by project or organization to quickly find specific reports. View historical reports for trend analysis and audit trails.",
      icon: <Filter size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default ReportingSteps;
