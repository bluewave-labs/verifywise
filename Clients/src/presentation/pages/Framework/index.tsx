import {
  Stack,
  Typography,
  Box,
  Button,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Popover
} from "@mui/material";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import { useContext, useEffect, useState, useMemo, useRef } from "react";
import {
  CirclePlus as AddCircleOutlineIcon,
  Settings as SettingsIcon,
  Trash2 as DeleteIconRed,
  Pencil as EditIconGrey,
  ChevronDown as WhiteDownArrowIcon,
} from "lucide-react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import useFrameworks from "../../../application/hooks/useFrameworks";
import useUsers from "../../../application/hooks/useUsers";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Tab } from "@mui/material";
import ISO27001Clause from "./ISO27001/Clause";
import ISO27001Annex from "./ISO27001/Annex";
import ISO42001Clause from "./ISO42001/Clause";
import ISO42001Annex from "./ISO42001/Annex";
import { getAllEntities } from "../../../application/repository/entity.repository";
import TabFilterBar from "../../components/FrameworkFilter/TabFilterBar";
import ProjectForm from "../../components/Forms/ProjectForm";
import AddFrameworkModal from "../ProjectView/AddNewFramework";
import allowedRoles from "../../../application/constants/permissions";
import CustomizableButton from "../../components/Button/CustomizableButton";
import DualButtonModal from "../../components/Dialogs/DualButtonModal";
import StandardModal from "../../components/Modals/StandardModal";
import { deleteProject } from "../../../application/repository/project.repository";
import { FrameworkTypeEnum } from "../../components/Forms/ProjectForm/constants";
import NoProject from "../../components/NoProject/NoProject";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import ButtonToggle from "../../components/ButtonToggle";
import TipBox from "../../components/TipBox";
import FrameworkDashboard from "./Dashboard";
import FrameworkSettings from "./Settings";
import FrameworkRisks from "./FrameworkRisks";
import FrameworkLinkedModels from "./FrameworkLinkedModels";
import PageTour from "../../components/PageTour";
import FrameworkSteps from "./FrameworkSteps";
import TabBar from "../../components/TabBar";
import NISTAIRMFGovern from "./NIST-AI-RMF/Govern";
import NISTAIRMFMap from "./NIST-AI-RMF/Map";
import NISTAIRMFMeasure from "./NIST-AI-RMF/Measure";
import NISTAIRMFManage from "./NIST-AI-RMF/Manage";

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
};

const tabListStyle = {
  minHeight: "20px",
  "& .MuiTabs-flexContainer": {
    columnGap: "34px",
  },
};

const Framework = () => {
  const [searchParams] = useSearchParams();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
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

  // NIST AI RMF parameters
  const functionId = searchParams.get("functionId");
  const categoryId = searchParams.get("categoryId");
  const subcategoryId = searchParams.get("subcategoryId");
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const { changeComponentVisibility, projects, userRoleName, setProjects } =
    useContext(VerifyWiseContext);
  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });
  const { users } = useUsers();

  // Check if there are any organizational projects
  const organizationalProject = useMemo(() => {
    return projects.find((project) => project.is_organizational === true);
  }, [projects]);

  // State for modals
  const [isProjectFormModalOpen, setIsProjectFormModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isFrameworkModalOpen, setIsFrameworkModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rotated, setRotated] = useState(false);
  const submitFormRef = useRef<(() => void) | undefined>();
  const createFormRef = useRef<(() => void) | undefined>();

  // State for dropdown menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

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

  // Handle dropdown menu
  const handleManageProjectClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
    const filtered = allFrameworks.filter((framework) => {
      const frameworkId = Number(framework.id);
      const isAssignedToProject = projectFrameworkIds.includes(frameworkId);
      const isNotEuAiAct = !framework.name.toLowerCase().includes("eu ai act");
      const isComplianceFramework =
        framework.name.toLowerCase().includes("iso 27001") ||
        framework.name.toLowerCase().includes("iso 42001") ||
        framework.name.toLowerCase().includes("nist ai rmf");

      return isAssignedToProject && isNotEuAiAct && isComplianceFramework;
    });

    // Sort to ensure ISO 42001 appears first, then ISO 27001, then NIST AI RMF
    return filtered.sort((a, b) => {
      const aIsISO42001 = a.name.toLowerCase().includes("iso 42001");
      const bIsISO42001 = b.name.toLowerCase().includes("iso 42001");
      const aIsISO27001 = a.name.toLowerCase().includes("iso 27001");
      const bIsISO27001 = b.name.toLowerCase().includes("iso 27001");
      const aIsNISTAI_RMF = a.name.toLowerCase().includes("nist ai rmf");
      const bIsNISTAI_RMF = b.name.toLowerCase().includes("nist ai rmf");

      // ISO 42001 comes first
      if (aIsISO42001 && !bIsISO42001) return -1;
      if (!aIsISO42001 && bIsISO42001) return 1;

      // ISO 27001 comes second
      if (aIsISO27001 && !bIsISO27001 && !bIsNISTAI_RMF) return -1;
      if (!aIsISO27001 && bIsISO27001 && !aIsNISTAI_RMF) return 1;

      // NIST AI RMF comes third
      if (aIsNISTAI_RMF && !bIsNISTAI_RMF) return -1;
      if (!aIsNISTAI_RMF && bIsNISTAI_RMF) return 1;

      return 0;
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

  // Default to "dashboard"
  const [mainTabValue, setMainTabValue] = useState(tab || "dashboard");
  const [selectedFramework, setSelectedFramework] = useState<number>(0);
  const [iso27001TabValue, setIso27001TabValue] = useState("clause");
  const [iso42001TabValue, setIso42001TabValue] = useState("clauses");
  const [nistAiRmfTabValue, setNistAiRmfTabValue] = useState("govern");

  // Filter states following ProjectFrameworks pattern
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [applicabilityFilter, setApplicabilityFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [reviewerFilter, setReviewerFilter] = useState<string>("");
  const [dueDateFilter, setDueDateFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [linkedModelsCount, setLinkedModelsCount] = useState<number>(0);

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

  // Status options for NIST AI RMF (same as other frameworks)
  const nistAiRmfStatusOptions = [
    { value: "not started", label: "Not Started" },
    { value: "in progress", label: "In Progress" },
    { value: "implemented", label: "Implemented" },
    { value: "awaiting approval", label: "Awaiting Approval" },
    { value: "awaiting review", label: "Awaiting Review" },
    { value: "draft", label: "Draft" },
    // { value: "audited", label: "Audited" },
    { value: "needs rework", label: "Needs Rework" },
  ];

  // User options for owner and reviewer filters
  const userOptions = useMemo(() => {
    return users.map((user: any) => ({
      value: user.id?.toString() || "",
      label: `${user.name} ${user.surname}`,
    }));
  }, [users]);

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
    if (framework || frameworkName) {
      setMainTabValue("controls");
    }
    if (framework === "iso-42001" || frameworkName === "iso-42001") {
      // Find ISO 42001 framework in filtered frameworks
      const iso42001Index = filteredFrameworks.findIndex(
        (fw) =>
          fw.name.toLowerCase().includes("iso") &&
          fw.name.toLowerCase().includes("42001")
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
      const iso27001Index = filteredFrameworks.findIndex(
        (fw) =>
          fw.name.toLowerCase().includes("iso") &&
          fw.name.toLowerCase().includes("27001")
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
    } else if (framework === "nist-ai-rmf" || frameworkName === "nist-ai-rmf") {
      // Find NIST AI RMF framework in filtered frameworks
      const nistAiRmfIndex = filteredFrameworks.findIndex(
        (fw) =>
          fw.name.toLowerCase().includes("nist") &&
          fw.name.toLowerCase().includes("ai") &&
          fw.name.toLowerCase().includes("rmf")
      );
      if (nistAiRmfIndex !== -1) {
        setSelectedFramework(nistAiRmfIndex);
      }

      // Set tab based on parameters (simplified since we combined functions/categories)
      if (subcategoryId) {
        setNistAiRmfTabValue("subcategories");
      } else {
        setNistAiRmfTabValue("functions");
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
    annexControl27001Id,
    functionId,
    categoryId,
    subcategoryId,
  ]);

  const resetFilters = () => {
    setStatusFilter("");
    setApplicabilityFilter("");
    setSearchTerm("");
    setOwnerFilter("");
    setReviewerFilter("");
    setDueDateFilter("");
  }

  // Reset filters when tab changes (following ProjectFrameworks pattern)
  useEffect(() => {
    if (organizationalProject) {
      resetFilters();
    }
  }, [
    iso27001TabValue,
    iso42001TabValue,
    nistAiRmfTabValue,
    organizationalProject,
  ]);

  const handleFrameworkSelect = (index: number) => {
    if (organizationalProject) {
      if(selectedFramework !== index) {
        resetFilters();
      }
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

  const handleNistAiRmfTabChange = (
    _: React.SyntheticEvent,
    newValue: string
  ) => {
    setNistAiRmfTabValue(newValue);
  };

  const handleMainTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setMainTabValue(newValue);
    if (newValue === "dashboard") {
      navigate("/framework");
    } else {
      navigate(`/framework/${newValue}`);
    }
  };

  useEffect(() => {
    const getLinkedModelCount = async() => {
      if (filteredFrameworks.length === 0) return;

      const framework = filteredFrameworks[selectedFramework];
      if (!framework) return;
      const frameworkId = framework?.id;

      const response = await getAllEntities({
        routeUrl: `/modelInventory/by-frameworkId/${frameworkId}`,
      });

      if (response && response.data) {
        setLinkedModelsCount(response.data.length);
      }
    };

    getLinkedModelCount();

  }, [filteredFrameworks, selectedFramework]);

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

    // Check if the selected framework is ISO 27001, ISO 42001, or NIST AI RMF
    const isISO27001 = framework.name.toLowerCase().includes("iso 27001");
    const isISO42001 = framework.name.toLowerCase().includes("iso 42001");
    const isNISTAI_RMF = framework.name.toLowerCase().includes("nist ai rmf");

    if (isISO27001) {
      return (
        <Box>
          <TabContext value={iso27001TabValue}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <TabList
                data-joyride-id="framework-clause-tabs"
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

            <TabPanel value="clause" sx={tabPanelStyle}>
              <ISO27001Clause
                project={organizationalProject}
                projectFrameworkId={
                  getProjectFrameworkId(framework.id) || framework.id
                }
                statusFilter={statusFilter}
                ownerFilter={ownerFilter}
                reviewerFilter={reviewerFilter}
                dueDateFilter={dueDateFilter}
                initialClauseId={clause27001Id}
                initialSubClauseId={subClause27001Id}
                searchTerm={searchTerm}
                onStatusChange={setStatusFilter}
                onOwnerChange={setOwnerFilter}
                onReviewerChange={setReviewerFilter}
                onDueDateChange={setDueDateFilter}
                onSearchTermChange={setSearchTerm}
                statusOptions={iso27001StatusOptions}
                ownerOptions={userOptions}
                reviewerOptions={userOptions}
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
                dueDateFilter={dueDateFilter}
                initialAnnexId={annex27001Id}
                initialAnnexControlId={annexControl27001Id}
                searchTerm={searchTerm}
                ownerFilter={ownerFilter}
                reviewerFilter={reviewerFilter}
                onStatusChange={setStatusFilter}
                onApplicabilityChange={setApplicabilityFilter}
                onOwnerChange={setOwnerFilter}
                onReviewerChange={setReviewerFilter}
                onDueDateChange={setDueDateFilter}
                onSearchTermChange={setSearchTerm}
                statusOptions={iso27001StatusOptions}
                ownerOptions={userOptions}
                reviewerOptions={userOptions}
              />
            </TabPanel>
          </TabContext>
        </Box>
      );
    }

    if (isISO42001) {
      return (
        <Box>
          <TabContext value={iso42001TabValue}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <TabList
                data-joyride-id="framework-clause-tabs"
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

            <TabPanel value="clauses" sx={tabPanelStyle}>
              <ISO42001Clause
                project={organizationalProject}
                projectFrameworkId={
                  getProjectFrameworkId(framework.id) || framework.id
                }
                statusFilter={statusFilter}
                ownerFilter={ownerFilter}
                reviewerFilter={reviewerFilter}
                dueDateFilter={dueDateFilter}
                initialClauseId={clauseId}
                initialSubClauseId={subClauseId}
                searchTerm={searchTerm}
                onStatusChange={setStatusFilter}
                onOwnerChange={setOwnerFilter}
                onReviewerChange={setReviewerFilter}
                onDueDateChange={setDueDateFilter}
                onSearchTermChange={setSearchTerm}
                statusOptions={iso42001StatusOptions}
                ownerOptions={userOptions}
                reviewerOptions={userOptions}
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
                dueDateFilter={dueDateFilter}
                initialAnnexId={annexId}
                initialAnnexCategoryId={annexCategoryId}
                searchTerm={searchTerm}
                ownerFilter={ownerFilter}
                reviewerFilter={reviewerFilter}
                onStatusChange={setStatusFilter}
                onApplicabilityChange={setApplicabilityFilter}
                onOwnerChange={setOwnerFilter}
                onReviewerChange={setReviewerFilter}
                onDueDateChange={setDueDateFilter}
                onSearchTermChange={setSearchTerm}
                statusOptions={iso42001StatusOptions}
                ownerOptions={userOptions}
                reviewerOptions={userOptions}
              />
            </TabPanel>
          </TabContext>
        </Box>
      );
    }

    if (isNISTAI_RMF) {
      return (
        <Box>
          <TabContext value={nistAiRmfTabValue}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <TabList
                data-joyride-id="framework-nist-ai-rmf-tabs"
                onChange={handleNistAiRmfTabChange}
                TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
                sx={tabListStyle}
              >
                <Tab
                  label="Govern"
                  value="govern"
                  sx={tabStyle}
                  disableRipple
                />
                <Tab label="Map" value="map" sx={tabStyle} disableRipple />
                <Tab
                  label="Measure"
                  value="measure"
                  sx={tabStyle}
                  disableRipple
                />
                <Tab
                  label="Manage"
                  value="manage"
                  sx={tabStyle}
                  disableRipple
                />
              </TabList>
            </Box>

            {/* Filter Bar following ProjectFrameworks pattern */}
            <TabFilterBar
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              showStatusFilter={true}
              statusOptions={nistAiRmfStatusOptions}
            />

            <TabPanel value="govern" sx={tabPanelStyle}>
              <NISTAIRMFGovern
                project={organizationalProject}
                projectFrameworkId={getProjectFrameworkId("4") || ""}
                statusFilter={statusFilter}
              />
            </TabPanel>
            <TabPanel value="map" sx={tabPanelStyle}>
              <NISTAIRMFMap
                project={organizationalProject}
                projectFrameworkId={getProjectFrameworkId("4") || ""}
                statusFilter={statusFilter}
              />
            </TabPanel>
            <TabPanel value="measure" sx={tabPanelStyle}>
              <NISTAIRMFMeasure
                project={organizationalProject}
                projectFrameworkId={getProjectFrameworkId("4") || ""}
                statusFilter={statusFilter}
              />
            </TabPanel>
            <TabPanel value="manage" sx={tabPanelStyle}>
              <NISTAIRMFManage
                project={organizationalProject}
                projectFrameworkId={getProjectFrameworkId("4") || ""}
                statusFilter={statusFilter}
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
    <Stack className="vwhome" gap={"16px"} ref={refs[0]}>
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Organizational frameworks"
        description="Navigate compliance frameworks like ISO 27001, ISO 42001, and NIST AI RMF for AI governance"
        whatItDoes="Provide *structured guidance* for implementing *organizational frameworks* and *compliance standards*. Access detailed requirements, clauses, annexes, and NIST AI RMF functions for *ISO 27001*, *ISO 42001*, and *NIST AI RMF* frameworks*."
        whyItMatters="**Compliance frameworks** ensure your organization meets *industry standards* and *regulatory requirements*. They provide *systematic approaches* to managing risks, implementing controls, and demonstrating *due diligence* to stakeholders and regulators."
        quickActions={[
          {
            label: "Explore Framework Requirements",
            description:
              "Browse detailed clauses and implementation guidelines for each framework",
            primary: true,
          },
          {
            label: "Check Compliance Status",
            description:
              "Review your organization's current compliance progress and gaps",
          },
        ]}
        useCases={[
          "*ISO 27001 implementation* for *information security management systems*",
          "*ISO 42001 compliance* for *artificial intelligence management systems* and *governance*",
          "*NIST AI RMF integration* for *AI risk management* and *trustworthy AI development*",
        ]}
        keyFeatures={[
          "**Comprehensive framework navigation** with *hierarchical clause structure*",
          "*Cross-referencing* between different *standards* and requirements",
          "*Progress tracking* and *compliance gap analysis* tools for implementation planning",
          "*AI risk management* through NIST framework functions and categories",
        ]}
        tips={[
          "Start with *gap analysis* to understand your *current compliance position*",
          "Focus on *foundational clauses* before moving to *specific technical requirements*",
          "Document your *implementation decisions* and evidence for *audit readiness*",
        ]}
      />
      <PageBreadcrumbs />
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <PageHeader
          title="Organizational Frameworks"
          description="This page provides an overview of available AI and data governance frameworks to your organization."
          rightContent={
            <HelperIcon
              onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
              size="small"
            />
          }
        />
        {/* Manage Project / New Project Button */}
        <Box>
          {organizationalProject ? (
            <>
              <CustomizableButton
                variant="contained"
                text="Manage frameworks"
                endIcon={<WhiteDownArrowIcon size={16} style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                onClick={(event: React.MouseEvent<any>) => {
                  setRotated((prev) => !prev);
                  handleManageProjectClick(event);
                }}
                isDisabled={
                  !allowedRoles.frameworks.manage.includes(userRoleName) &&
                  !allowedRoles.projects.edit.includes(userRoleName) &&
                  !allowedRoles.projects.delete.includes(userRoleName)
                }
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  gap: 2,
                  "&:hover": {
                    backgroundColor: "#0e5c47",
                  },
                }}
              />
              <Popover
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
                sx={{
                  mt: 1,
                  "& .MuiPopover-paper": {
                    borderRadius: "4px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    border: "1px solid #d0d5dd",
                    overflow: "visible",
                    backgroundColor: "#fff",
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
                      size={16}
                      style={{
                        color: "text.secondary",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Add/remove frameworks"
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
                    <EditIconGrey
                      size={16}
                      style={{
                        color: "text.secondary",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Edit project"
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
                      size={16}
                      style={{
                        color: "#DB504A",
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delete project"
                    primaryTypographyProps={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "error.main",
                    }}
                  />
                </MenuItem>
              </Popover>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon size={16} />}
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

      {/* Tips */}
      <TipBox entityName="framework" />

      {/* <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
        }}
      >
        {organizationalProject ? (
          <>
            <Button
              variant="contained"
              endIcon={<WhiteDownArrowIcon size={16} style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
              onClick={(event: React.MouseEvent<any>) => {
                setRotated((prev) => !prev);
                handleManageProjectClick(event);
              }}
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
                    size={16}
                    style={{
                      color: "text.secondary",
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
                  <EditIconGrey
                    size={16}
                    style={{
                      color: "text.secondary",
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
                    size={16}
                    style={{
                      color: "#DB504A",
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
            startIcon={<AddCircleOutlineIcon size={16} />}
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
      </Box> */}

      {/* Only show framework content if organizational project exists */}
      {organizationalProject && (
        <>
          <TabContext value={mainTabValue}>
            <TabBar
              tabs={[
                {
                  label: "Dashboard",
                  value: "dashboard",
                  icon: "LayoutDashboard",
                },
                {
                  label: "Framework risks",
                  value: "framework-risks",
                  icon: "AlertTriangle",
                },
                {
                  label: "Linked models",
                  value: "linked-models",
                  icon: "Link",
                  count: linkedModelsCount,
                },
                {
                  label: "Controls and Requirements",
                  value: "controls",
                  icon: "FileCode",
                },
                {
                  label: "Settings",
                  value: "settings",
                  icon: "Settings",
                },
              ]}
              activeTab={mainTabValue}
              onChange={handleMainTabChange}
              dataJoyrideId="framework-main-tabs"
            />

            <TabPanel value="dashboard" sx={tabPanelStyle}>
              <Box data-joyride-id="framework-dashboard">
                <FrameworkDashboard
                  organizationalProject={organizationalProject}
                  filteredFrameworks={filteredFrameworks}
                />
              </Box>
            </TabPanel>

            <TabPanel value="controls" sx={tabPanelStyle}>
              <Stack className="frameworks-switch" spacing={3}>
                {/* Framework toggle (ISO 27001/ISO 42001 selectors) */}
                {organizationalProject && filteredFrameworks.length > 0 && (
                  <Box data-joyride-id="framework-toggle">
                    <ButtonToggle
                      options={filteredFrameworks.map((framework, index) => ({
                        value: index.toString(),
                        label: framework.name,
                      }))}
                      value={selectedFramework.toString()}
                      onChange={(value) =>
                        handleFrameworkSelect(parseInt(value))
                      }
                      height={34}
                    />
                  </Box>
                )}
                {/* Content that changes based on selected framework */}
                {renderFrameworkContent()}
              </Stack>
            </TabPanel>

            <TabPanel value="framework-risks" sx={tabPanelStyle}>
              <FrameworkRisks
                organizationalProject={organizationalProject}
                filteredFrameworks={filteredFrameworks}
                selectedFramework={selectedFramework}
                onFrameworkSelect={handleFrameworkSelect}
              />
            </TabPanel>

            <TabPanel value="linked-models" sx={tabPanelStyle}>
              <FrameworkLinkedModels
                organizationalProject={organizationalProject}
                filteredFrameworks={filteredFrameworks}
                selectedFramework={selectedFramework}
                onFrameworkSelect={handleFrameworkSelect}
              />
            </TabPanel>

            <TabPanel value="settings" sx={tabPanelStyle}>
              <FrameworkSettings
                organizationalProject={organizationalProject}
                allFrameworks={allFrameworks}
                filteredFrameworks={filteredFrameworks}
                onProjectDataChanged={refreshProjectData}
                onFrameworksChanged={refreshFilteredFrameworks}
                setProjects={setProjects}
              />
            </TabPanel>
          </TabContext>
        </>
      )}

      {/* Show message when no organizational project exists */}
      {!organizationalProject && (
        <NoProject message="No Organizational Project Found. Create a new organizational project to manage ISO 27001, ISO 42001, and NIST AI RMF frameworks for your organization." />
      )}

      {/* Modals */}
      {isProjectFormModalOpen && (
        <StandardModal
          isOpen={isProjectFormModalOpen}
          onClose={async () => {
            setIsProjectFormModalOpen(false);
            await refreshProjectData();
          }}
          title="Create new framework"
          description="Set up a new organizational framework below"
          onSubmit={() => {
            if (createFormRef.current) {
              createFormRef.current();
            }
          }}
          submitButtonText="Create framework"
          maxWidth="900px"
        >
          <ProjectForm
            defaultFrameworkType={FrameworkTypeEnum.OrganizationWide}
            useStandardModal={true}
            onSubmitRef={createFormRef}
            onClose={async () => {
              setIsProjectFormModalOpen(false);
              await refreshProjectData();
            }}
          />
        </StandardModal>
      )}

      {isEditProjectModalOpen && organizationalProject && (
        <StandardModal
          isOpen={isEditProjectModalOpen}
          onClose={async () => {
            setIsEditProjectModalOpen(false);
            await refreshProjectData();
          }}
          title="Edit framework"
          description="Update your framework details below"
          onSubmit={() => {
            if (submitFormRef.current) {
              submitFormRef.current();
            }
          }}
          submitButtonText="Update framework"
          maxWidth="900px"
        >
          <ProjectForm
            projectToEdit={organizationalProject}
            defaultFrameworkType={FrameworkTypeEnum.OrganizationWide}
            useStandardModal={true}
            onSubmitRef={submitFormRef}
            onClose={async () => {
              setIsEditProjectModalOpen(false);
              await refreshProjectData();
            }}
          />
        </StandardModal>
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

      {/* Page Tour */}
      <PageTour steps={FrameworkSteps} run={true} tourKey="framework-tour" />
    </Stack>
  );
};

export default Framework;
