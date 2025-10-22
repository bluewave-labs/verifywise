import { PageTourStep } from "../../../components/PageTour";
import { BarChart3, ClipboardCheck } from "lucide-react";

const AssessmentSteps: PageTourStep[] = [
    {
      target: '[data-joyride-id="assessment-progress-bar"]',
      content: {
        header: "Assessment Progress",
        body: "Track your assessment completion status in real-time. This progress indicator shows how many topics have been evaluated and what remains to be assessed.",
        icon: <BarChart3 size={20} color="#ffffff" />,
      },
    },
    {
      target: '[data-joyride-id="assessment-topics"]',
      content: {
        header: "Assessment Topics",
        body: "Navigate through different assessment categories and complete the evaluation questions for your AI project. Each topic covers specific aspects of AI risk and governance.",
        icon: <ClipboardCheck size={20} color="#ffffff" />,
      },
    },
  ];

  export default AssessmentSteps;