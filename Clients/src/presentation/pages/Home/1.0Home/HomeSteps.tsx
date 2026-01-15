import { FolderPlus } from "lucide-react";
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
];

export default HomeSteps;
