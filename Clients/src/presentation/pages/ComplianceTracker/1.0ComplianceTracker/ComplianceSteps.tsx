import { Shield, TrendingUp, FolderTree } from "lucide-react";
import { IPageTourStep } from "../../../types/interfaces/i.tour";

const ComplianceSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="compliance-heading"]',
    content: {
      header: "Regulatory Controls",
      body: "View all compliance controls and requirements for your selected regulation. Each control represents a specific requirement that needs to be addressed.",
      icon: <Shield size={20} color="#ffffff" />,
    },
    placement: "left",
  },
  {
    target: '[data-joyride-id="compliance-progress-bar"]',
    content: {
      header: "Track Your Progress",
      body: "Monitor your overall compliance status at a glance. The progress bar shows how many controls have been completed and what still needs attention.",
      icon: <TrendingUp size={20} color="#ffffff" />,
    },
    placement: "left",
  },
  {
    target: '[data-joyride-id="control-groups"]',
    content: {
      header: "Control Groups",
      body: "Controls are organized into logical groups and subcontrols for easier navigation. Complete each control to improve your compliance statistics and track progress by category.",
      icon: <FolderTree size={20} color="#ffffff" />,
    },
    placement: "left",
  },
];

export default ComplianceSteps;
