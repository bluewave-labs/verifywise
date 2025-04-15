import CustomStep from "../../components/PageTour/CustomStep";
import { PageTourStep } from "../../components/PageTour";

const VendorsSteps: PageTourStep[] = [
  {
    target: '[data-joyride-id="add-new-vendor"]',
    content: (
      <CustomStep body="Here, you can add AI providers that you use in our project, and input the necessary information to ensure compliance." />
    ),
    placement: "bottom-end",
  },
];

export default VendorsSteps;