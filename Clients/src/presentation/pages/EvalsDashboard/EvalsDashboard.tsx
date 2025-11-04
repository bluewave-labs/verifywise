import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Tab from "@mui/material/Tab";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";

// Tab components
import ProjectsList from "./ProjectsList";
import ProjectOverview from "./ProjectOverview";
import ProjectExperiments from "./ProjectExperiments";
import ProjectMonitor from "./ProjectMonitor";
import ProjectConfiguration from "./ProjectConfiguration";

export default function EvalsDashboard() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine tab from URL hash or default
  const [tab, setTab] = useState(() => {
    const hash = location.hash.replace("#", "");
    if (projectId) {
      return hash || "overview";
    }
    return "projects";
  });

  const [currentProject, setCurrentProject] = useState<any>(null);

  useEffect(() => {
    // If we have a projectId, we're in project view
    if (!projectId) {
      setTab("projects");
    }
  }, [projectId]);

  const handleTabChange = (_: any, newValue: string) => {
    setTab(newValue);
    // Update URL hash
    navigate(`${location.pathname}#${newValue}`, { replace: true });
  };

  const breadcrumbItems = projectId && currentProject
    ? [
        { label: "Evals", onClick: () => navigate("/evals") },
        { label: currentProject.name },
      ]
    : [{ label: "Evals" }];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <PageBreadcrumbs items={breadcrumbItems} />
        <PageHeader
          title={projectId && currentProject ? currentProject.name : "LLM Evaluations"}
        />
      </Box>

      <Box sx={{ px: 3, py: 2 }}>
        {!projectId ? (
          // Projects list view (no tabs)
          <ProjectsList />
        ) : (
          // Project detail view with tabs
          <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <TabList
                onChange={handleTabChange}
                TabIndicatorProps={{
                  style: { backgroundColor: "#13715B", height: "2px" },
                }}
              >
                <Tab
                  label="Overview"
                  value="overview"
                  disableRipple
                  sx={{ textTransform: "none !important" }}
                />
                <Tab
                  label="Experiments"
                  value="experiments"
                  disableRipple
                  sx={{ textTransform: "none !important" }}
                />
                <Tab
                  label="Monitor"
                  value="monitor"
                  disableRipple
                  sx={{ textTransform: "none !important" }}
                />
                <Tab
                  label="Configuration"
                  value="configuration"
                  disableRipple
                  sx={{ textTransform: "none !important" }}
                />
              </TabList>
            </Box>

            <TabPanel value="overview" sx={{ p: 0 }}>
              <ProjectOverview
                projectId={projectId}
                project={currentProject}
                onProjectUpdate={setCurrentProject}
              />
            </TabPanel>

            <TabPanel value="experiments" sx={{ p: 0 }}>
              <ProjectExperiments projectId={projectId} />
            </TabPanel>

            <TabPanel value="monitor" sx={{ p: 0 }}>
              <ProjectMonitor projectId={projectId} />
            </TabPanel>

            <TabPanel value="configuration" sx={{ p: 0 }}>
              <ProjectConfiguration
                projectId={projectId}
                project={currentProject}
                onProjectUpdate={setCurrentProject}
              />
            </TabPanel>
          </TabContext>
        )}
      </Box>
    </Box>
  );
}

