import CustomStep from "../../components/PageTour/CustomStep";
import { PageTourStep } from "../../components/PageTour";

const FileSteps: PageTourStep[] = [
  {
    target: '[data-joyride-id="file-manager-title"]',
    content: (
      <CustomStep body="The table below lists all the files uploaded to the system." />
    ),
    placement: "left",
  },
];

export default FileSteps;