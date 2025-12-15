import { Stack, Typography } from "@mui/material";
import {
  projectViewHeaderDesc,
  projectViewHeaderTitle,
  tabPanelStyle,
} from "./style";
import TabPanel from "@mui/lab/TabPanel";
import { SyntheticEvent, useState, useEffect, useMemo } from "react";
import TabContext from "@mui/lab/TabContext";
import VWProjectOverview from "./Overview";
import { useSearchParams } from "react-router-dom";
import CustomizableSkeleton from "../../../components/Skeletons";
import VWProjectRisks from "./ProjectRisks";
import LinkedModels from "./LinkedModels";
import ProjectSettings from "../ProjectSettings";
import useProjectData from "../../../../application/hooks/useProjectData";
import ProjectFrameworks from "../ProjectFrameworks";
import CustomizableToast from "../../../components/Toast";
import CEMarking from "../CEMarking";
import allowedRoles from "../../../../application/constants/permissions";
import PageBreadcrumbs from "../../../components/Breadcrumbs/PageBreadcrumbs";
import { useAuth } from "../../../../application/hooks/useAuth";
import { IBreadcrumbItem } from "../../../../domain/interfaces/i.breadcrumbs";
import { getRouteIcon } from "../../../components/Breadcrumbs/routeMapping";
import { FileText as FileTextIcon } from "lucide-react";
import TabBar from "../../../components/TabBar";
import { getAllProjectRisksByProjectId } from "../../../../application/repository/projectRisk.repository";
import { getAllEntities } from "../../../../application/repository/entity.repository";

const VWProjectView = () => {
  const { userRoleName } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "1";
  const tabParam = searchParams.get("tab");
  const framework = searchParams.get("framework");
  const [refreshKey, setRefreshKey] = useState(0);
  const { project } = useProjectData({ projectId, refreshKey });

  // Initialize tab value from URL parameter or default to "overview"
  const [value, setValue] = useState(tabParam || "overview");
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  // State for tab counts
  const [projectRisksCount, setProjectRisksCount] = useState<number>(0);
  const [linkedModelsCount, setLinkedModelsCount] = useState<number>(0);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Create custom breadcrumb items
  const breadcrumbItems: IBreadcrumbItem[] = useMemo(() => {
    const items: IBreadcrumbItem[] = [
      {
        label: "Dashboard",
        path: "/",
        icon: getRouteIcon("/"),
      },
      {
        label: "Use cases",
        path: "/overview",
        icon: getRouteIcon("/overview"),
      },
    ];

    // Add the project name as the last breadcrumb item if project is loaded
    if (project) {
      items.push({
        label: project.project_title,
        path: "", // No path since this is the current page
        disabled: true, // Make it non-clickable as it's the current page
        icon: <FileTextIcon size={14} strokeWidth={1.5} />,
      });
    }

    return items;
  }, [project]);

  // Update tab value when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setValue(tabParam);
    }
  }, [tabParam]);

  // Fetch project risks count
  useEffect(() => {
    const fetchRisksCount = async () => {
      if (!projectId) return;
      setIsLoadingRisks(true);
      try {
        const response = await getAllProjectRisksByProjectId({
          projectId: String(projectId),
          filter: "active",
        });
        setProjectRisksCount(response.data?.length || 0);
      } catch (error) {
        console.error("Error fetching project risks count:", error);
        setProjectRisksCount(0);
      } finally {
        setIsLoadingRisks(false);
      }
    };
    fetchRisksCount();
  }, [projectId, refreshKey]);

  // Fetch linked models count
  useEffect(() => {
    const fetchLinkedModelsCount = async () => {
      if (!projectId) return;
      setIsLoadingModels(true);
      try {
        const response = await getAllEntities({
          routeUrl: `/modelInventory/by-projectId/${projectId}`,
        });
        setLinkedModelsCount(response.data?.length || 0);
      } catch (error) {
        console.error("Error fetching linked models count:", error);
        setLinkedModelsCount(0);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchLinkedModelsCount();
  }, [projectId, refreshKey]);

  const handleChange = (_: SyntheticEvent, newValue: string) => {
    if (tabParam) {
      searchParams.delete("tab");
      searchParams.delete("framework");
      searchParams.delete("topicId");
      searchParams.delete("questionId");
      setSearchParams(searchParams);
    }
    setValue(newValue);
  };

  const handleRefresh = (isTrigger: boolean, toastMessage?: string) => {
    if (isTrigger) {
      setRefreshKey((prevKey) => prevKey + 1); // send refresh trigger to projectdata hook
      if (toastMessage) {
        setToast({ message: toastMessage, visible: true });
        setTimeout(() => setToast({ message: "", visible: false }), 3000);
      }
    }
  };

  return (
    <Stack className="vw-project-view">
      <PageBreadcrumbs
        items={breadcrumbItems}
        autoGenerate={false}
        showCurrentPage={true}
      />
      {toast.visible && <CustomizableToast title={toast.message} />}
      <Stack className="vw-project-view-header" sx={{ mb: 10 }}>
        {project ? (
          <>
            <Typography sx={projectViewHeaderTitle}>
              Use-case general view
            </Typography>
            <Typography sx={projectViewHeaderDesc}>
              This use case includes all the governance process status of{" "}
              <Typography component="span" sx={{ color: "#13715B", fontSize: "inherit" }}>
                {project.project_title}
              </Typography>
            </Typography>
          </>
        ) : (
          <>
            <CustomizableSkeleton variant="text" width="60%" height={32} />
            <CustomizableSkeleton variant="text" width="80%" height={24} />
          </>
        )}
      </Stack>
      <Stack className="vw-project-view-body">
        <TabContext value={value}>
          <TabBar
            tabs={[
              {
                label: "Overview",
                value: "overview",
                icon: "LayoutDashboard",
              },
              {
                label: "Use case risks",
                value: "project-risks",
                icon: "AlertTriangle",
                count: projectRisksCount,
                isLoading: isLoadingRisks,
              },
              {
                label: "Linked models",
                value: "linked-models",
                icon: "Box",
                count: linkedModelsCount,
                isLoading: isLoadingModels,
              },
              {
                label: "Frameworks/regulations",
                value: "frameworks",
                icon: "Shield",
              },
              {
                label: "CE Marking",
                value: "ce-marking",
                icon: "Award",
              },
              {
                label: "Settings",
                value: "settings",
                icon: "Settings",
                disabled: !allowedRoles.projects.edit.includes(userRoleName),
              },
            ]}
            activeTab={value}
            onChange={handleChange}
          />

          <TabPanel value="overview" sx={tabPanelStyle}>
            {project ? (
              <VWProjectOverview project={project} />
            ) : (
              // <></>
              <CustomizableSkeleton
                variant="rectangular"
                width="100%"
                height={400}
              />
            )}
          </TabPanel>
          <TabPanel value="project-risks" sx={tabPanelStyle}>
            {project ? (
              // Render project risks content here
              <VWProjectRisks />
            ) : (
              <CustomizableSkeleton
                variant="rectangular"
                width="100%"
                height={400}
              />
            )}
          </TabPanel>
          <TabPanel value="linked-models" sx={tabPanelStyle}>
            {project ? (
              <LinkedModels project={project} />
            ) : (
              <CustomizableSkeleton
                variant="rectangular"
                width="100%"
                height={400}
              />
            )}
          </TabPanel>
          <TabPanel value="frameworks" sx={tabPanelStyle}>
            {project ? (
              // Render frameworks content here
              <ProjectFrameworks
                project={project}
                triggerRefresh={handleRefresh}
                initialFrameworkId={
                  framework === "iso-42001"
                    ? 2
                    : framework === "eu-ai-act"
                    ? 1
                    : project.framework[0].framework_id
                }
              />
            ) : (
              <CustomizableSkeleton
                variant="rectangular"
                width="100%"
                height={400}
              />
            )}
          </TabPanel>
          <TabPanel value="ce-marking" sx={tabPanelStyle}>
            {project ? (
              <CEMarking projectId={projectId} />
            ) : (
              <CustomizableSkeleton
                variant="rectangular"
                width="100%"
                height={400}
              />
            )}
          </TabPanel>
          <TabPanel value="settings" sx={tabPanelStyle}>
            {project ? (
              // Render settings content here
              <ProjectSettings triggerRefresh={handleRefresh} />
            ) : (
              <CustomizableSkeleton
                variant="rectangular"
                width="100%"
                height={400}
              />
            )}
          </TabPanel>
        </TabContext>
      </Stack>
    </Stack>
  );
};

export default VWProjectView;
