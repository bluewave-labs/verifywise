import { PageTourStep } from "../../components/PageTour";
import { Plus, Lock, LayoutGrid, BarChart3 } from "lucide-react";

const DashboardSteps: PageTourStep[] = [
  {
    target: '[data-joyride-id="dashboard-widgets"]',
    content: {
      header: "Dashboard overview",
      body: "Your centralized view of AI governance metrics. Monitor use cases, models, vendors, policies, trainings, and reports at a glance with status breakdowns.",
      icon: <LayoutGrid size={20} color="#ffffff" />,
    },
    placement: "bottom",
  },
  {
    target: '[data-joyride-id="add-new-dropdown"]',
    content: {
      header: "Quick add menu",
      body: "Quickly create new use cases, vendors, models, risks, or policies without navigating to different pages. Your shortcuts to common actions.",
      icon: <Plus size={20} color="#ffffff" />,
    },
    placement: "bottom-end",
  },
  {
    target: '[data-joyride-id="edit-mode-toggle"]',
    content: {
      header: "Customize layout",
      body: "Toggle edit mode to rearrange widgets by dragging and resizing them. Create a dashboard layout that matches your workflow.",
      icon: <Lock size={20} color="#ffffff" />,
    },
    placement: "bottom-end",
  },
  {
    target: '[data-joyride-id="widget-card"]',
    content: {
      header: "Interactive metric cards",
      body: "Click any widget to navigate to detailed views. Hover to see status distributions and critical items requiring attention.",
      icon: <BarChart3 size={20} color="#ffffff" />,
    },
    placement: "left",
  },
];

export default DashboardSteps;
