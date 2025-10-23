import { PageTourStep } from "../../components/PageTour";
import { Eye, Layout } from "lucide-react";

const AITrustCenterSteps: PageTourStep[] = [
  {
    target: '[data-joyride-id="trust-center-tabs"]',
    content: {
      header: "Navigate trust center sections",
      body: "Explore different sections of your public trust center. Switch between Overview, Resources, Subprocessors, and Settings to customize each aspect of your external-facing portal.",
      icon: <Layout size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="preview-mode-button"]',
    content: {
      header: "Preview public view",
      body: "See exactly how your AI Trust Center appears to external visitors, stakeholders, and customers. Test your branding and content before publishing.",
      icon: <Eye size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default AITrustCenterSteps;
