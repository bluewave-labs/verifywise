import { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppModule } from "../../../application/redux/ui/uiSlice";
import { useEvalsSidebarContextSafe } from "../../../application/contexts/EvalsSidebar.context";
import { useAIDetectionSidebarContextSafe } from "../../../application/contexts/AIDetectionSidebar.context";
import Sidebar from "../Sidebar";
import EvalsSidebar from "../../pages/EvalsDashboard/EvalsSidebar";
import AIDetectionSidebar from "../../pages/AIDetection/AIDetectionSidebar";
import GatewaySidebar from "./GatewaySidebar";

interface ContextSidebarProps {
  activeModule: AppModule;
  // Props for main Sidebar
  onOpenCreateDemoData?: () => void;
  onOpenDeleteDemoData?: () => void;
  hasDemoData?: boolean;
}

/**
 * ContextSidebar renders the appropriate sidebar based on the active module.
 * - 'main': Renders the main VerifyWise sidebar
 * - 'evals': Renders EvalsSidebar (state provided via EvalsSidebarContext)
 * - 'gateway': Renders the Gateway sidebar placeholder
 * - 'ai-detection': Renders AIDetectionSidebar (state provided via AIDetectionSidebarContext)
 */
const ContextSidebar: FC<ContextSidebarProps> = ({
  activeModule,
  onOpenCreateDemoData,
  onOpenDeleteDemoData,
  hasDemoData,
}) => {
  const evalsSidebarContext = useEvalsSidebarContextSafe();
  const aiDetectionSidebarContext = useAIDetectionSidebarContextSafe();
  const location = useLocation();
  const navigate = useNavigate();

  // Get active tab from URL hash for evals
  const evalsActiveTab = location.hash.replace("#", "") || "overview";

  // Handle tab change for evals by navigating to the new hash
  // If we have a selected project but aren't on a project-specific URL, navigate to the project
  const handleEvalsTabChange = (newTab: string) => {
    const pathParts = location.pathname.split("/");
    const hasProjectInUrl = pathParts.length > 2 && pathParts[2]; // /evals/:projectId

    // If there's no project in URL but we have a selected project, navigate to that project
    if (!hasProjectInUrl && evalsSidebarContext?.currentProject) {
      navigate(`/evals/${evalsSidebarContext.currentProject.id}#${newTab}`, { replace: true });
    } else {
      navigate(`${location.pathname}#${newTab}`, { replace: true });
    }
  };

  // Get active tab for AI Detection based on URL path
  const getAIDetectionActiveTab = (): string => {
    if (location.pathname.includes("/scans/")) return "history";
    if (location.pathname.includes("/history")) return "history";
    if (location.pathname.includes("/settings")) return "settings";
    return "scan";
  };

  // Handle tab change for AI Detection
  const handleAIDetectionTabChange = (tab: string) => {
    if (tab === "scan") {
      navigate("/ai-detection/scan");
    } else if (tab === "history") {
      navigate("/ai-detection/history");
    } else if (tab === "settings") {
      navigate("/ai-detection/settings");
    }
  };

  switch (activeModule) {
    case "main":
      return (
        <Sidebar
          onOpenCreateDemoData={onOpenCreateDemoData}
          onOpenDeleteDemoData={onOpenDeleteDemoData}
          hasDemoData={hasDemoData}
        />
      );
    case "evals":
      // Render EvalsSidebar - use URL hash for active tab, context for counts
      return (
        <EvalsSidebar
          activeTab={evalsActiveTab}
          onTabChange={handleEvalsTabChange}
          experimentsCount={evalsSidebarContext?.experimentsCount ?? 0}
          datasetsCount={evalsSidebarContext?.datasetsCount ?? 0}
          scorersCount={evalsSidebarContext?.scorersCount ?? 0}
          disabled={evalsSidebarContext?.disabled ?? true}
          recentExperiments={evalsSidebarContext?.recentExperiments ?? []}
          recentProjects={evalsSidebarContext?.recentProjects ?? []}
          onExperimentClick={evalsSidebarContext?.onExperimentClick}
          onProjectClick={evalsSidebarContext?.onProjectClick}
          currentProject={evalsSidebarContext?.currentProject}
          allProjects={evalsSidebarContext?.allProjects ?? []}
          onProjectChange={evalsSidebarContext?.onProjectChange}
        />
      );
    case "gateway":
      return <GatewaySidebar />;
    case "ai-detection":
      // Render AIDetectionSidebar - state provided via context
      return (
        <AIDetectionSidebar
          activeTab={getAIDetectionActiveTab()}
          onTabChange={handleAIDetectionTabChange}
          historyCount={aiDetectionSidebarContext?.historyCount ?? 0}
          recentScans={aiDetectionSidebarContext?.recentScans ?? []}
          onScanClick={aiDetectionSidebarContext?.onScanClick}
        />
      );
    default:
      return (
        <Sidebar
          onOpenCreateDemoData={onOpenCreateDemoData}
          onOpenDeleteDemoData={onOpenDeleteDemoData}
          hasDemoData={hasDemoData}
        />
      );
  }
};

export default ContextSidebar;
