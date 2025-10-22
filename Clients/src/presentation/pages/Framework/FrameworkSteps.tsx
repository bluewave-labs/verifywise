import { PageTourStep } from "../../components/PageTour";
import { Layout } from "lucide-react";

const FrameworkSteps: PageTourStep[] = [
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
