/**
 * Shadow AI Main Page
 *
 * Container component for the Shadow AI module.
 * Manages URL-based navigation and renders appropriate content.
 * Follows the same pattern as AIDetectionPage.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { Stack } from "@mui/material";
import { Eye, BarChart3, Users, Bot, ShieldAlert, Settings } from "lucide-react";
import { PageBreadcrumbs } from "../../components/breadcrumbs/PageBreadcrumbs";
import InsightsPage from "./InsightsPage";
import UserActivityPage from "./UserActivityPage";
import AIToolsPage from "./AIToolsPage";
import RulesPage from "./RulesPage";
import SettingsPage from "./SettingsPage";

type ActiveTab = "insights" | "users" | "tools" | "rules" | "settings";

export default function ShadowAIPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (): ActiveTab => {
    if (location.pathname.includes("/shadow-ai/user-activity")) return "users";
    if (location.pathname.includes("/shadow-ai/tools")) return "tools";
    if (location.pathname.includes("/shadow-ai/rules")) return "rules"; // includes /rules/alerts
    if (location.pathname.includes("/shadow-ai/settings")) return "settings";
    return "insights";
  };

  const activeTab = getActiveTab();

  const getBreadcrumbItems = () => {
    const baseItem = {
      label: "Shadow AI",
      path: "/shadow-ai",
      icon: <Eye size={14} strokeWidth={1.5} />,
      onClick: () => navigate("/shadow-ai"),
    };

    switch (activeTab) {
      case "insights":
        return [
          baseItem,
          { label: "Insights", icon: <BarChart3 size={14} strokeWidth={1.5} /> },
        ];
      case "users":
        return [
          baseItem,
          { label: "User activity", icon: <Users size={14} strokeWidth={1.5} /> },
        ];
      case "tools":
        return [
          baseItem,
          { label: "AI tools", icon: <Bot size={14} strokeWidth={1.5} /> },
        ];
      case "rules":
        return [
          baseItem,
          { label: "Rules", icon: <ShieldAlert size={14} strokeWidth={1.5} /> },
        ];
      case "settings":
        return [
          baseItem,
          { label: "Settings", icon: <Settings size={14} strokeWidth={1.5} /> },
        ];
      default:
        return [baseItem];
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "insights":
        return <InsightsPage />;
      case "users":
        return <UserActivityPage />;
      case "tools":
        return <AIToolsPage />;
      case "rules":
        return <RulesPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <Stack className="vwhome" gap="16px">
      <PageBreadcrumbs items={getBreadcrumbItems()} />
      {renderContent()}
    </Stack>
  );
}
