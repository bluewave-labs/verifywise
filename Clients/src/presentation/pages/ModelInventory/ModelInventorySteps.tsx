import { BarChart3, Filter, Search, PlusCircle } from "lucide-react";
import { IPageTourStep } from "../../../domain/interfaces/i.tour";

const ModelInventorySteps: IPageTourStep[] = [
  {
    target: '[data-joyride-id="add-model-button"]',
    content: {
      header: "Register new models",
      body: "Add new AI models to your inventory with comprehensive metadata including provider, version, capabilities, security assessment, and usage details.",
      icon: <PlusCircle size={20} color="#ffffff" />,
    },
    placement: "bottom-end",
  },
  {
    target: '[data-joyride-id="model-summary-cards"]',
    content: {
      header: "Model status summary",
      body: "Track your AI models by approval status at a glance: Approved, Restricted, Pending, and Blocked.",
      icon: <BarChart3 size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="model-status-filter"]',
    content: {
      header: "Filter by approval status",
      body: "Focus on models that need attention by filtering by approval status. Quickly identify pending approvals or restricted models.",
      icon: <Filter size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="model-search"]',
    content: {
      header: "Search models",
      body: "Search your model inventory by model name, provider, or version to quickly locate specific AI models in your registry.",
      icon: <Search size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
];

export default ModelInventorySteps;
