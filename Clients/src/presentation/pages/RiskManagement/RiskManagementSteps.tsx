import { PageTourStep } from "../../components/PageTour";
import { BarChart3, Filter, Database, AlertTriangle } from "lucide-react";

const RiskManagementSteps: PageTourStep[] = [
  {
    target: '[data-joyride-id="risk-summary-cards"]',
    content: {
      header: "Risk distribution overview",
      body: "View your risk landscape across all AI projects by severity level: Very High, High, Medium, Low, and Very Low. Quickly identify which risks need immediate attention.",
      icon: <BarChart3 size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="risk-filters"]',
    content: {
      header: "Advanced risk filtering",
      body: "Filter risks by category, severity level, likelihood, mitigation status, and deletion status. Combine filters to find exactly what you're looking for.",
      icon: <Filter size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="import-ai-risks-button"]',
    content: {
      header: "MIT AI risk database",
      body: "Import industry-standard risks from the MIT AI Risk Database for comprehensive coverage. Browse curated risks by lifecycle phase and category.",
      icon: <Database size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="add-risk-button"]',
    content: {
      header: "Create custom risks",
      body: "Identify and document new risks specific to your AI projects. Assess severity and likelihood, assign owners, and define mitigation strategies with target dates.",
      icon: <AlertTriangle size={20} color="#ffffff" />,
    },
    placement: "bottom-end",
  },
];

export default RiskManagementSteps;
