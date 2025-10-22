import { PageTourStep } from "../../components/PageTour";
import { FileText } from "lucide-react";

const FileSteps: PageTourStep[] = [
  {
    target: '[data-joyride-id="file-manager-title"]',
    content: {
      header: "Organize Documentation",
      body: "All uploaded files are catalogued here. Upload policy documents, compliance certificates, assessment reports, and other AI governance documentation for easy access and reference.",
      icon: <FileText size={20} color="#ffffff" />,
    },
    placement: "left",
  },
];

export default FileSteps;