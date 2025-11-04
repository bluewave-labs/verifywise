import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, MenuItem, Select } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Tab from "@mui/material/Tab";
import { LayoutDashboard, FlaskConical, Activity, ChevronDown } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";

// Tab components
import ProjectsList from "./ProjectsList";
import ProjectOverview from "./ProjectOverview";
import ProjectExperiments from "./ProjectExperiments";
import ProjectMonitor from "./ProjectMonitor";
import type { DeepEvalProject } from "./types";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";

export default function EvalsDashboard() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine tab from URL hash or default (only when viewing a project)
  const [tab, setTab] = useState(() => {
    if (!projectId) return "overview"; // Default, but won't be used
    const hash = location.hash.replace("#", "");
    return hash || "overview";
  });

  const [currentProject, setCurrentProject] = useState<DeepEvalProject | null>(null);
  const [allProjects, setAllProjects] = useState<DeepEvalProject[]>([]);

  // Load all projects for the dropdown
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await deepEvalProjectsService.getAllProjects();
        setAllProjects(data.projects);
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    };
    if (projectId) {
      loadProjects();
    }
  }, [projectId]);

  const handleTabChange = (_: unknown, newValue: string) => {
    setTab(newValue);
    // Update URL hash
    navigate(`${location.pathname}#${newValue}`, { replace: true });
  };

  const handleProjectChange = (newProjectId: string) => {
    navigate(`/evals/${newProjectId}#${tab}`);
  };

  const breadcrumbItems = [{ label: "Evals", onClick: () => navigate("/evals") }];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <PageBreadcrumbs items={breadcrumbItems} />
        
        {/* Project selector dropdown or Projects list title */}
        {projectId && allProjects.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              IconComponent={() => <ChevronDown size={16} style={{ marginRight: 8 }} />}
              sx={{
                fontSize: "20px",
                fontWeight: 600,
                border: "none",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
                "& .MuiSelect-select": {
                  py: 0.5,
                  px: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                },
              }}
            >
              {allProjects.map((proj) => (
                <MenuItem key={proj.id} value={proj.id}>
                  {proj.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        ) : (
          <PageHeader title="LLM Evaluations" />
        )}
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
                sx={{
                  minHeight: 40,
                  "& .MuiTab-root": {
                    minHeight: 40,
                    py: 1,
                    px: 3,
                    mr: 2,
                  },
                }}
              >
                <Tab
                  icon={<LayoutDashboard size={16} />}
                  iconPosition="start"
                  label="Overview"
                  value="overview"
                  disableRipple
                  sx={{ textTransform: "none !important", fontSize: "14px", gap: 1.5 }}
                />
                <Tab
                  icon={<FlaskConical size={16} />}
                  iconPosition="start"
                  label="Experiments"
                  value="experiments"
                  disableRipple
                  sx={{ textTransform: "none !important", fontSize: "14px", gap: 1.5 }}
                />
                <Tab
                  icon={<Activity size={16} />}
                  iconPosition="start"
                  label="Monitor"
                  value="monitor"
                  disableRipple
                  sx={{ textTransform: "none !important", fontSize: "14px", gap: 1.5 }}
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
          </TabContext>
        )}
      </Box>
    </Box>
  );
}

