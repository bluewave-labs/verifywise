import { FileText } from "lucide-react";
import { IPageTourStep } from "../../../domain/interfaces/i.tour";

const FileSteps: IPageTourStep[] = [
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
