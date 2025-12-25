import { Layout } from "lucide-react";
import { IPageTourStep } from "../../types/interfaces/i.tour";

const FrameworkSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="framework-main-tabs"]',
    content: {
      header: "Framework sections",
      body: "Navigate between Dashboard overview, Controls & Requirements details, and Settings. Manage your organizational compliance frameworks comprehensively.",
      icon: <Layout size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default FrameworkSteps;
