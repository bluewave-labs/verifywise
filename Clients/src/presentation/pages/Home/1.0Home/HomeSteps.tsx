import { FolderPlus, Compass } from "lucide-react";
import { IPageTourStep } from "../../../types/interfaces/i.tour";

const HomeSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="new-project-button"]',
    content: {
      header: "Create your first project",
      body: "Start by creating a project that represents an AI activity or system in your organization. Each project helps you manage compliance, assessments, and vendor relationships.",
      icon: <FolderPlus size={20} color="#ffffff" />,
    },
  },
  {
    target: '[data-joyride-id="dashboard-navigation"]',
    content: {
      header: "Navigate your dashboard",
      body: "Access compliance tracking, risk assessments, vendor management, and documentation from the sidebar. Everything you need to maintain AI governance is organized here.",
      icon: <Compass size={20} color="#ffffff" />,
    },
  },
];

export default HomeSteps;
