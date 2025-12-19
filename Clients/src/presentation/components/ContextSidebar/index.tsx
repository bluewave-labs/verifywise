import { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppModule } from "../../../application/redux/ui/uiSlice";
import { useEvalsSidebarContextSafe } from "../../../application/contexts/EvalsSidebar.context";
import Sidebar from "../Sidebar";
import EvalsSidebar from "../../pages/EvalsDashboard/EvalsSidebar";
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
 */
const ContextSidebar: FC<ContextSidebarProps> = ({
  activeModule,
  onOpenCreateDemoData,
  onOpenDeleteDemoData,
  hasDemoData,
}) => {
  const evalsSidebarContext = useEvalsSidebarContextSafe();
  const location = useLocation();
  const navigate = useNavigate();

  // Get active tab from URL hash for evals
  const activeTab = location.hash.replace("#", "") || "overview";

  // Handle tab change by navigating to the new hash
  const handleTabChange = (newTab: string) => {
    navigate(`${location.pathname}#${newTab}`, { replace: true });
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
          activeTab={activeTab}
          onTabChange={handleTabChange}
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
