import { Building2, CirclePlus } from "lucide-react";
import { IPageTourStep } from "../../../domain/interfaces/i.tour";

const VendorsSteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="add-new-vendor"]',
    content: {
      header: "Add new vendor",
      body: "Register external AI providers and third-party services. Document vendor information, contracts, and compliance requirements in one centralized location.",
      icon: <CirclePlus size={20} color="#ffffff" />,
    },
    placement: "bottom-end",
  },
  {
    target: '[data-joyride-id="vendor-list-tab"]',
    content: {
      header: "Vendor management tabs",
      body: "Switch between managing vendor details and tracking vendor-related risks. Monitor both vendor information and associated security concerns.",
      icon: <Building2 size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default VendorsSteps;
