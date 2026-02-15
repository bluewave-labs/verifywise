/**
 * Shadow AI Main Page
 *
 * Container component for the Shadow AI module.
 * Manages URL-based navigation and renders appropriate content.
 * Follows the same pattern as AIDetectionPage.
 */

import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Stack } from "@mui/material";
import { Eye, BarChart3, Users, Bot, ShieldAlert, FileBarChart2, Settings } from "lucide-react";
import { PageBreadcrumbs } from "../../components/breadcrumbs/PageBreadcrumbs";
import { useShadowAISidebarContextSafe } from "../../../application/contexts/ShadowAISidebar.context";
import { getTools } from "../../../application/repository/shadowAi.repository";
import InsightsPage from "./InsightsPage";
import UserActivityPage from "./UserActivityPage";
import AIToolsPage from "./AIToolsPage";
import RulesPage from "./RulesPage";
import SettingsPage from "./SettingsPage";
import ReportingPage from "./ReportingPage";
import ShadowAIOnboarding from "../../components/Modals/ShadowAIOnboarding";

type ActiveTab = "insights" | "users" | "tools" | "rules" | "reporting" | "settings";

export default function ShadowAIPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const sidebarContext = useShadowAISidebarContextSafe();
  const setToolsCount = sidebarContext?.setToolsCount;
  const setRecentTools = sidebarContext?.setRecentTools;
  const setOnToolClick = sidebarContext?.setOnToolClick;

  const getActiveTab = (): ActiveTab => {
    if (location.pathname.includes("/shadow-ai/user-activity")) return "users";
    if (location.pathname.includes("/shadow-ai/tools")) return "tools";
    if (location.pathname.includes("/shadow-ai/rules")) return "rules"; // includes /rules/alerts
    if (location.pathname.includes("/shadow-ai/reporting")) return "reporting";
    if (location.pathname.includes("/shadow-ai/settings")) return "settings";
    return "insights";
  };

  const activeTab = getActiveTab();

  // Load recent tools for sidebar
  useEffect(() => {
    if (!setToolsCount || !setRecentTools) return;
    let cancelled = false;

    const load = async () => {
      try {
        const response = await getTools({
          page: 1,
          limit: 5,
          sort_by: "last_seen_at",
          order: "desc",
        });
        if (cancelled) return;
        setToolsCount(response.total);
        setRecentTools(
          response.tools.map((t) => ({ id: t.id, name: t.name }))
        );
      } catch (error) {
        console.error("Failed to load recent tools:", error);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [setToolsCount, setRecentTools]);

  // Wire up tool click handler for sidebar
  const handleToolClick = useCallback(
    (toolId: number) => {
      navigate(`/shadow-ai/tools/${toolId}`);
    },
    [navigate]
  );

  useEffect(() => {
    if (setOnToolClick) {
      setOnToolClick(() => handleToolClick);
    }
  }, [setOnToolClick, handleToolClick]);

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
      case "reporting":
        return [
          baseItem,
          { label: "Reporting", icon: <FileBarChart2 size={14} strokeWidth={1.5} /> },
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
      case "reporting":
        return <ReportingPage />;
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
      <ShadowAIOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </Stack>
  );
}
