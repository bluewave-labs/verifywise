import { CirclePlus } from "lucide-react";
import { IPageTourStep } from "../../types/interfaces/i.tour";

const TrainingSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="add-training-button"]',
    content: {
      header: "Add new training",
      body: "Register AI-related training programs and educational resources. Track completion status, certifications, and learning progress across your team.",
      icon: <CirclePlus size={20} color="#ffffff" />,
    },
    placement: "bottom-end",
  },
];

export default TrainingSteps;
