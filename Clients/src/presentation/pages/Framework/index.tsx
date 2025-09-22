import {
  Stack,
  Typography,
  Box,
  Button,
  Modal,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import organizationalFrameworksHelpContent from "../../helpers/organizational-frameworks-help.html?raw";
import { useContext, useEffect, useState, useMemo } from "react";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg";
import { ReactComponent as SettingsIcon } from "../../assets/icons/setting-small.svg";
import { ReactComponent as DeleteIconRed } from "../../assets/icons/trash-filled-red.svg";
import EditIcon from "@mui/icons-material/Edit";
import { ReactComponent as WhiteDownArrowIcon } from "../../assets/icons/chevron-down-white.svg";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import singleTheme from "../../themes/v1SingleTheme";
import useFrameworks from "../../../application/hooks/useFrameworks";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Tab } from "@mui/material";
import ISO27001Clause from "./ISO27001/Clause";
import ISO27001Annex from "./ISO27001/Annex";
import ISO42001Clause from "./ISO42001/Clause";
import ISO42001Annex from "./ISO42001/Annex";
import TabFilterBar from "../../components/FrameworkFilter/TabFilterBar";
import ProjectForm from "../../components/Forms/ProjectForm";
import AddFrameworkModal from "../ProjectView/AddNewFramework";
import allowedRoles from "../../../application/constants/permissions";
import DualButtonModal from "../../components/Dialogs/DualButtonModal";
import { deleteProject } from "../../../application/repository/project.repository";
import { FrameworkTypeEnum } from "../../components/Forms/ProjectForm/constants";
import NoProject from "../../components/NoProject/NoProject";
import { useSearchParams } from "react-router-dom";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";

// Tab styles following ProjectFrameworks pattern
const tabStyle = {
  textTransform: "none",
  fontWeight: 400,
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "16px 0 7px",
  minHeight: "20px",
  minWidth: "auto",
  "&.Mui-selected": {
    color: "#13715B",
  },
};

const tabPanelStyle = {
  padding: 0,
  pt: 10,
};

const tabListStyle = {
  minHeight: "20px",
  "& .MuiTabs-flexContainer": {
    columnGap: "34px",
  },
};

// Framework toggle styles following ProjectFrameworks pattern
const frameworkTabsContainerStyle = {
  display: "flex",
  border: (theme: any) => `1px solid ${theme.palette.divider}`,
  borderRadius: "4px",
  overflow: "hidden",
  height: 43,
  bgcolor: "background.paper",
  width: "fit-content",
};

const getFrameworkTabStyle = (isActive: boolean, isLast: boolean) => ({
  cursor: "pointer",
  px: 5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  bgcolor: isActive ? "background.paper" : "action.hover",
  color: "text.primary",
  fontFamily: (theme: any) => theme.typography.fontFamily,
  fontSize: "13px",
  borderRight: (theme: any) =>
    isLast ? "none" : `1px solid ${theme.palette.divider}`,
  fontWeight: (theme: any) => theme.typography.body2.fontWeight,
  transition: "background 0.2s",
  userSelect: "none",
  width: "fit-content",
  minWidth: "120px",
});

const Framework = () => {
  const [searchParams] = useSearchParams();
  const framework = searchParams.get("framework");
  const frameworkName = searchParams.get("frameworkName");

  // ISO 42001 parameters
  const clauseId = searchParams.get("clauseId");
  const subClauseId = searchParams.get("subClauseId");
  const annexId = searchParams.get("annexId");
  const annexCategoryId = searchParams.get("annexCategoryId");

  // ISO 27001 parameters
  const clause27001Id = searchParams.get("clause27001Id");
  const subClause27001Id = searchParams.get("subClause27001Id");
  const annex27001Id = searchParams.get("annex27001Id");
  const annexControl27001Id = searchParams.get("annexControl27001Id");
  const [rotated, setRotated] = useState(false);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const { changeComponentVisibility, projects, userRoleName, setProjects } =
    useContext(VerifyWiseContext);
  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });
  const dropDownStyle = singleTheme.dropDownStyles.primary;

  // Check if there are any organizational projects
  const organizationalProject = useMemo(() => {
    return projects.find((project) => project.is_organizational === true);
  }, [projects]);

  // State for modals
  const [isProjectFormModalOpen, setIsProjectFormModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isFrameworkModalOpen, setIsFrameworkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State for dropdown menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  // Handle dropdown menu
  const handleManageProjectClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setRotated(false);
  };

  const handleManageFrameworksClick = () => {
    setIsFrameworkModalOpen(true);
    handleMenuClose();
  };

  const handleEditProjectClick = () => {
    setIsEditProjectModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteProjectClick = () => {
    setIsDeleteModalOpen(true);
    handleMenuClose();
  };

  // Function to refresh project data after framework changes
  const refreshProjectData = async () => {
    try {
      // Import the projects repository function
      const { getAllProjects } = await import(
        "../../../application/repository/project.repository"
      );
      const response = await getAllProjects();
      if (response?.data) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error("Error refreshing projects:", error);
    }
  };

  // Function to handle project deletion
  const handleDeleteProject = async () => {
    if (!organizationalProject) return;

    try {
      const response = await deleteProject({
        id: organizationalProject.id,
      });

      if (response.status >= 200 && response.status < 300) {
        // Remove the project from context
        setProjects((prevProjects) =>
          prevProjects.filter(
            (project) => project.id !== organizationalProject.id
          )
        );
        // Stay on the Framework page - the UI will automatically show "No Organizational Project Found"
      } else {
        console.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // Fetch all frameworks
  const { allFrameworks, loading, error, refreshFilteredFrameworks } =
    useFrameworks({
      listOfFrameworks: organizationalProject?.framework || [], // Use organizational project's frameworks
    });

  // Only show frameworks that are actually assigned to the organizational project
  const filteredFrameworks = useMemo(() => {
    if (!organizationalProject || !organizationalProject.framework) {
      return [];
    }

    // Get framework IDs from the organizational project
    const projectFrameworkIds = organizationalProject.framework.map((f) =>
      Number(f.framework_id)
    );

    // Filter frameworks to only include those assigned to the project and exclude EU AI Act
    return allFrameworks.filter((framework) => {
      const frameworkId = Number(framework.id);
      const isAssignedToProject = projectFrameworkIds.includes(frameworkId);
      const isNotEuAiAct = !framework.name.toLowerCase().includes("eu ai act");
      const isIsoFramework =
        framework.name.toLowerCase().includes("iso 27001") ||
        framework.name.toLowerCase().includes("iso 42001");

      return isAssignedToProject && isNotEuAiAct && isIsoFramework;
    });
  }, [allFrameworks, organizationalProject]);

  // Helper function to get projectFrameworkId for a given framework
  const getProjectFrameworkId = (frameworkId: string) => {
    if (!organizationalProject?.framework) return null;

    const projectFramework = organizationalProject.framework.find(
      (f) => f.framework_id === Number(frameworkId)
    );

    return projectFramework?.project_framework_id || null;
  };

  const [selectedFramework, setSelectedFramework] = useState<number>(0);
  const [iso27001TabValue, setIso27001TabValue] = useState("clause");
  const [iso42001TabValue, setIso42001TabValue] = useState("clauses");

  // Filter states following ProjectFrameworks pattern
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [applicabilityFilter, setApplicabilityFilter] = useState<string>("all");

  // Status options following ProjectFrameworks pattern for ISO27001
  const iso27001StatusOptions = [
    { value: "not started", label: "Not Started" },
    { value: "in progress", label: "In Progress" },
    { value: "implemented", label: "Implemented" },
    { value: "awaiting approval", label: "Awaiting Approval" },
    { value: "awaiting review", label: "Awaiting Review" },
    { value: "draft", label: "Draft" },
    // { value: "audited", label: "Audited" },
    { value: "needs rework", label: "Needs Rework" },
  ];

  // Status options for ISO42001 (same as project view)
  const iso42001StatusOptions = [
    { value: "not started", label: "Not Started" },
    { value: "in progress", label: "In Progress" },
    { value: "implemented", label: "Implemented" },
    { value: "awaiting approval", label: "Awaiting Approval" },
    { value: "awaiting review", label: "Awaiting Review" },
    { value: "draft", label: "Draft" },
    // { value: "audited", label: "Audited" },
    { value: "needs rework", label: "Needs Rework" },
  ];

  useEffect(() => {
    if (allVisible) {
      changeComponentVisibility("projectFrameworks", true);
    }
  }, [allVisible, changeComponentVisibility]);

  // Reset selected framework when filtered frameworks change
  useEffect(() => {
    if (
      !frameworkName &&
      filteredFrameworks.length > 0 &&
      selectedFramework >= filteredFrameworks.length
    ) {
      setSelectedFramework(0);
    }
  }, [filteredFrameworks, selectedFramework, frameworkName]);

  useEffect(() => {
    if (framework === "iso-42001" || frameworkName === "iso-42001") {
      // Find ISO 42001 framework in filtered frameworks
      const iso42001Index = filteredFrameworks.findIndex(fw =>
        fw.name.toLowerCase().includes("iso") && fw.name.toLowerCase().includes("42001")
      );
      if (iso42001Index !== -1) {
        setSelectedFramework(iso42001Index);
      }

      // Set tab based on parameters
      if (annexId || annexCategoryId) {
        setIso42001TabValue("annexes");
      } else if (clauseId || subClauseId) {
        setIso42001TabValue("clauses");
      }
    } else if (framework === "iso-27001" || frameworkName === "iso-27001") {
      // Find ISO 27001 framework in filtered frameworks
      const iso27001Index = filteredFrameworks.findIndex(fw =>
        fw.name.toLowerCase().includes("iso") && fw.name.toLowerCase().includes("27001")
      );
      if (iso27001Index !== -1) {
        setSelectedFramework(iso27001Index);
      }

      // Set tab based on parameters
      if (annex27001Id || annexControl27001Id) {
        setIso27001TabValue("annex");
      } else if (clause27001Id || subClause27001Id) {
        setIso27001TabValue("clause");
      }
    }
  }, [
    framework,
    frameworkName,
    filteredFrameworks,
    clauseId,
    subClauseId,
    annexId,
    annexCategoryId,
    clause27001Id,
    subClause27001Id,
    annex27001Id,
    annexControl27001Id
  ]);

  // Reset filters when tab changes (following ProjectFrameworks pattern)
  useEffect(() => {
    if (organizationalProject) {
      setStatusFilter("");
      setApplicabilityFilter("");
    }
  }, [iso27001TabValue, iso42001TabValue, organizationalProject]);

  const handleFrameworkSelect = (index: number) => {
    if (organizationalProject) {
      setSelectedFramework(index);
    }
  };

  const handleIso27001TabChange = (
    _: React.SyntheticEvent,
    newValue: string
  ) => {
    setIso27001TabValue(newValue);
  };

  const handleIso42001TabChange = (
    _: React.SyntheticEvent,
    newValue: string
  ) => {
    setIso42001TabValue(newValue);
  };

  const renderFrameworkContent = () => {
    if (loading) {
      return (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            Loading framework information...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="body1" color="error">
            Error loading frameworks. Please try again.
          </Typography>
        </Box>
      );
    }

    // Only proceed if organizational project exists
    if (!organizationalProject) {
      return null;
    }

    if (!filteredFrameworks.length) {
      return (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            backgroundColor: "#F9FAFB",
            borderRadius: 2,
            border: "1px solid #E5E7EB",
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No ISO frameworks assigned to this project yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the "Manage Frameworks" button to add ISO 27001 or ISO 42001
            frameworks to your organizational project.
          </Typography>
        </Box>
      );
    }

    const framework = filteredFrameworks[selectedFramework];
    if (!framework) return null;

    // Check if the selected framework is ISO 27001 or ISO 42001
    const isISO27001 = framework.name.toLowerCase().includes("iso 27001");
    const isISO42001 = framework.name.toLowerCase().includes("iso 42001");

    if (isISO27001) {
      return (
        <Box sx={{ mt: 6 }}>
          <TabContext value={iso27001TabValue}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
              <TabList
                onChange={handleIso27001TabChange}
                TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
                sx={tabListStyle}
              >
                <Tab
                  label="Clauses"
                  value="clause"
                  sx={tabStyle}
                  disableRipple
                />
                <Tab
                  label="Annexes"
                  value="annex"
                  sx={tabStyle}
                  disableRipple
                />
              </TabList>
            </Box>

            {/* Filter Bar following ProjectFrameworks pattern */}
            <TabFilterBar
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              applicabilityFilter={applicabilityFilter}
              onApplicabilityChange={setApplicabilityFilter}
              showStatusFilter={
                iso27001TabValue === "clause" || iso27001TabValue === "annex"
              }
              showApplicabilityFilter={iso27001TabValue === "annex"}
              statusOptions={iso27001StatusOptions}
            />

            <TabPanel value="clause" sx={tabPanelStyle}>
              <ISO27001Clause
                project={organizationalProject}
                projectFrameworkId={
                  getProjectFrameworkId(framework.id) || framework.id
                }
                statusFilter={statusFilter}
                initialClauseId={clause27001Id}
                initialSubClauseId={subClause27001Id}
              />
            </TabPanel>

            <TabPanel value="annex" sx={tabPanelStyle}>
              <ISO27001Annex
                project={organizationalProject}
                projectFrameworkId={
                  getProjectFrameworkId(framework.id) || framework.id
                }
                statusFilter={statusFilter}
                applicabilityFilter={applicabilityFilter}
                initialAnnexId={annex27001Id}
                initialAnnexControlId={annexControl27001Id}
              />
            </TabPanel>
          </TabContext>
        </Box>
      );
    }

    if (isISO42001) {
      return (
        <Box sx={{ mt: 6 }}>
          <TabContext value={iso42001TabValue}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
              <TabList
                onChange={handleIso42001TabChange}
                TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
                sx={tabListStyle}
              >
                <Tab
                  label="Clauses"
                  value="clauses"
                  sx={tabStyle}
                  disableRipple
                />
                <Tab
                  label="Annexes"
                  value="annexes"
                  sx={tabStyle}
                  disableRipple
                />
              </TabList>
            </Box>

            {/* Filter Bar following ProjectFrameworks pattern */}
            <TabFilterBar
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              applicabilityFilter={applicabilityFilter}
              onApplicabilityChange={setApplicabilityFilter}
              showStatusFilter={
                iso42001TabValue === "clauses" || iso42001TabValue === "annexes"
              }
              showApplicabilityFilter={iso42001TabValue === "annexes"}
              statusOptions={iso42001StatusOptions}
            />

            <TabPanel value="clauses" sx={tabPanelStyle}>
              <ISO42001Clause
                project={organizationalProject}
                projectFrameworkId={
                  getProjectFrameworkId(framework.id) || framework.id
                }
                statusFilter={statusFilter}
                initialClauseId={clauseId}
                initialSubClauseId={subClauseId}
              />
            </TabPanel>

            <TabPanel value="annexes" sx={tabPanelStyle}>
              <ISO42001Annex
                project={organizationalProject}
                projectFrameworkId={
                  getProjectFrameworkId(framework.id) || framework.id
                }
                statusFilter={statusFilter}
                applicabilityFilter={applicabilityFilter}
                initialAnnexId={annexId}
                initialAnnexCategoryId={annexCategoryId}
              />
            </TabPanel>
          </TabContext>
        </Box>
      );
    }

    // Default content for other frameworks
    return (
      <Box
        sx={{
          mt: 6,
          p: 6,
          backgroundColor: "#000000",
          borderRadius: 3,
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "#FFFFFF",
            textAlign: "center",
            maxWidth: "600px",
          }}
        >
          This is a dummy content space for {framework.name}. The actual
          framework content will be implemented here.
        </Typography>
      </Box>
    );
  };

  return (
    <Stack className="vwhome" gap={"24px"} ref={refs[0]}>
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={organizationalFrameworksHelpContent}
        pageTitle="Organizational Frameworks"
      />
      <PageBreadcrumbs />
      <Stack>
      <PageHeader
               title="Framework"
               description="This page provides an overview of available AI compliance frameworks.
              Explore different frameworks to understand their requirements and
              implementation guidelines."
               rightContent={
                  <HelperIcon
                     onClick={() =>
                     setIsHelperDrawerOpen(!isHelperDrawerOpen)
                     }
                     size="small"
                    />
                 }
       />
        {/* Framework Controls Section - ISO selectors and Manage Project button on same line */}
        <Box
          sx={{
            mt: "24px",
            mb: "0px",
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Framework toggle (ISO 27001/ISO 42001 selectors) */}
          {organizationalProject && filteredFrameworks.length > 0 && (
            <Box sx={frameworkTabsContainerStyle}>
              {filteredFrameworks.map((framework, index) => (
                <Box
                  key={framework.id}
                  onClick={() => handleFrameworkSelect(index)}
                  sx={getFrameworkTabStyle(
                    selectedFramework === index,
                    index === filteredFrameworks.length - 1
                  )}
                >
                  {framework.name}
                </Box>
              ))}
            </Box>
          )}

          {/* Manage Project Button */}
          {organizationalProject ? (
            <>
              <Button
                variant="contained"
                endIcon={<WhiteDownArrowIcon />}
                onClick={(event) => {
                  setRotated((prev) => !prev);
                  handleManageProjectClick(event);
                }}
                disableRipple
                disabled={
                  !allowedRoles.frameworks.manage.includes(userRoleName) &&
                  !allowedRoles.projects.edit.includes(userRoleName) &&
                  !allowedRoles.projects.delete.includes(userRoleName)
                }
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#0e5c47",
                    boxShadow: "0px 4px 8px rgba(19, 113, 91, 0.3)",
                  },
                  "&:disabled": {
                    backgroundColor: "#cccccc",
                    color: "#666666",
                    boxShadow: "none",
                  },
                  "& .MuiButton-endIcon": {
                    marginLeft: 1,
                    transition: "transform 0.2s ease",
                    transform: rotated ? "rotate(180deg)" : "rotate(0deg)",
                  },
                }}
              >
                Manage Project
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                slotProps={{
                  paper: {
                    sx: {
                      ...dropDownStyle,
                      width: 200,
                      mt: 1,
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={handleManageFrameworksClick}
                  disabled={
                    !allowedRoles.frameworks.manage.includes(userRoleName)
                  }
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <SettingsIcon
                      fontSize="small"
                      style={{
                        color: "text.secondary",
                        fontSize: "16px",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Manage Frameworks"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "text.primary",
                    }}
                  />
                </MenuItem>
                <MenuItem
                  onClick={handleEditProjectClick}
                  disabled={!allowedRoles.projects.edit.includes(userRoleName)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <EditIcon
                      fontSize="small"
                      sx={{
                        color: "text.secondary",
                        fontSize: "16px",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Edit Project"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "text.primary",
                    }}
                  />
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem
                  onClick={handleDeleteProjectClick}
                  disabled={
                    !allowedRoles.projects.delete.includes(userRoleName)
                  }
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <DeleteIconRed
                      fontSize="small"
                      style={{
                        color: "error.main",
                        fontSize: "16px",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delete Project"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "error.main",
                    }}
                  />
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setIsProjectFormModalOpen(true)}
              disabled={!allowedRoles.projects.create.includes(userRoleName)}
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#0e5c47",
                },
                "&:disabled": {
                  backgroundColor: "#cccccc",
                  color: "#666666",
                },
              }}
            >
              New Project
            </Button>
          )}
        </Box>
      </Stack>

      {/* Only show framework content if organizational project exists */}
      {organizationalProject && (
        <Stack className="frameworks-switch" sx={{ mt: 0 }}>
          {/* Content that changes based on selected framework */}
          {renderFrameworkContent()}
        </Stack>
      )}

      {/* Show message when no organizational project exists */}
      {!organizationalProject && (
        <NoProject message="No Organizational Project Found. Create a new organizational project to manage ISO 27001 and ISO 42001 frameworks for your organization." />
      )}

      {/* Modals */}
      {isProjectFormModalOpen && (
        <Modal
          open={isProjectFormModalOpen}
          onClose={async (_event, reason) => {
            // Prevent closing on backdrop click
            if (reason === "backdropClick") {
              return;
            }
            setIsProjectFormModalOpen(false);
            // Refresh project data after editing the project
            await refreshProjectData();
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: 24,
              maxHeight: "90vh",
              maxWidth: "90vw",
              overflow: "auto",
              outline: "none",
              p: 0,
            }}
          >
            <ProjectForm
              defaultFrameworkType={FrameworkTypeEnum.OrganizationWide}
              onClose={async () => {
                setIsProjectFormModalOpen(false);
                // Refresh project data after creating a new project
                await refreshProjectData();
              }}
            />
          </Box>
        </Modal>
      )}

      {isEditProjectModalOpen && organizationalProject && (
        <Modal
          open={isEditProjectModalOpen}
          onClose={async (_event, reason) => {
            // Prevent closing on backdrop click
            if (reason === "backdropClick") {
              return;
            }
            setIsEditProjectModalOpen(false);
            // Refresh project data after editing the project
            await refreshProjectData();
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: 24,
              maxHeight: "90vh",
              maxWidth: "90vw",
              overflow: "auto",
              outline: "none",
              p: 0,
            }}
          >
            <ProjectForm
              projectToEdit={organizationalProject}
              defaultFrameworkType={FrameworkTypeEnum.OrganizationWide}
              onClose={async () => {
                setIsEditProjectModalOpen(false);
                // Refresh project data after editing the project
                await refreshProjectData();
              }}
            />
          </Box>
        </Modal>
      )}

      {isFrameworkModalOpen && organizationalProject && (
        <AddFrameworkModal
          open={isFrameworkModalOpen}
          onClose={() => setIsFrameworkModalOpen(false)}
          frameworks={allFrameworks.filter((framework) => {
            // Only show organizational frameworks (ISO 27001 and ISO 42001) for organizational projects
            const isNotEuAiAct = !framework.name
              .toLowerCase()
              .includes("eu ai act");
            const isIsoFramework =
              framework.name.toLowerCase().includes("iso 27001") ||
              framework.name.toLowerCase().includes("iso 42001");
            return isNotEuAiAct && isIsoFramework;
          })}
          project={organizationalProject}
          onFrameworksChanged={async () => {
            // Refresh both frameworks and project data
            await refreshProjectData();
            refreshFilteredFrameworks();
            setIsFrameworkModalOpen(false);
          }}
        />
      )}

      {isDeleteModalOpen && organizationalProject && (
        <DualButtonModal
          title="Confirm Delete"
          body={
            <Typography fontSize={13}>
              Are you sure you want to delete the project "
              {organizationalProject.project_title}"? This action cannot be
              undone and will remove all associated data.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Delete"
          onCancel={() => setIsDeleteModalOpen(false)}
          onProceed={handleDeleteProject}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}
    </Stack>
  );
};

export default Framework;