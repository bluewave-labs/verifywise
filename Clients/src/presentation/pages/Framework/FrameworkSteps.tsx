import { LayoutDashboard } from "lucide-react";
import { IPageTourStep } from "../../types/interfaces/i.tour";

const FrameworkSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="framework-dashboard"]',
    content: {
      header: "Framework dashboard",
      body: "View and manage your organizational compliance frameworks. Track progress across controls and requirements.",
      icon: <LayoutDashboard size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default FrameworkSteps;
