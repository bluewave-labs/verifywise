import CustomStep from "../../../components/PageTour/CustomStep";
import { PageTourStep } from "../../../components/PageTour";

const ComplianceSteps: PageTourStep[] = [
    {
      target: '[data-joyride-id="compliance-heading"]',
      content: (
        <CustomStep body="Here youll see a list of controls related to the regulation you selected." />
      ),
      placement: "left",
    },
    {
      target: '[data-joyride-id="compliance-progress-bar"]',
      content: (
        <CustomStep body="Check th status of your compliance tracker here." />
      ),
      placement: "left",
    },
    {
      target: '[data-joyride-id="control-groups"]',
      content: (
        <CustomStep body="Those are the groups where controls and subcontrols reside. As you fill them, your statistics improve." />
      ),
      placement: "left",
    },
  ];

export default ComplianceSteps;
