import {
  Stack,
  Typography,
  Box,
} from "@mui/material";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import { useContext, useEffect, useState, useMemo } from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
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
import NoProject from "../../components/NoProject/NoProject";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import ButtonToggle from "../../components/ButtonToggle";
import FrameworkDashboard from "./Dashboard";
import FrameworkSettings from "./Settings";
import FrameworkRisks from "./FrameworkRisks";
import FrameworkLinkedModels from "./FrameworkLinkedModels";
import PageTour from "../../components/PageTour";
import FrameworkSteps from "./FrameworkSteps";

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
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const { changeComponentVisibility, projects, setProjects } =
    useContext(VerifyWiseContext);
  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });

  // Check if there are any organizational projects
  const organizationalProject = useMemo(() => {
    return projects.find((project) => project.is_organizational === true);
  }, [projects]);


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
      const isIsoFramework =
        framework.name.toLowerCase().includes("iso 27001") ||
        framework.name.toLowerCase().includes("iso 42001");

      return isAssignedToProject && isNotEuAiAct && isIsoFramework;
    });

    // Sort to ensure ISO 42001 appears first, then ISO 27001
    return filtered.sort((a, b) => {
      const aIsISO42001 = a.name.toLowerCase().includes("iso 42001");
      const bIsISO42001 = b.name.toLowerCase().includes("iso 42001");
      const aIsISO27001 = a.name.toLowerCase().includes("iso 27001");
      const bIsISO27001 = b.name.toLowerCase().includes("iso 27001");

      // ISO 42001 comes first
      if (aIsISO42001 && bIsISO27001) return -1;
      if (aIsISO27001 && bIsISO42001) return 1;

      // Keep other frameworks in their original order
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
    if (framework || frameworkName) {
      setMainTabValue("controls");
    }
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

  const handleMainTabChange = (
    _: React.SyntheticEvent,
    newValue: string
  ) => {
    setMainTabValue(newValue);
    if (newValue === "dashboard") {
      navigate("/framework");
    } else {
      navigate(`/framework/${newValue}`);
    }
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
        description="Navigate compliance frameworks like ISO 27001 and ISO 42001 for AI governance"
        whatItDoes="Provide *structured guidance* for implementing *organizational frameworks* and *compliance standards*. Access detailed requirements, clauses, and annexes for *ISO 27001* and *ISO 42001 frameworks*."
        whyItMatters="**Compliance frameworks** ensure your organization meets *industry standards* and *regulatory requirements*. They provide *systematic approaches* to managing risks, implementing controls, and demonstrating *due diligence* to stakeholders and regulators."
        quickActions={[
          {
            label: "Explore Framework Requirements",
            description: "Browse detailed clauses and implementation guidelines for each framework",
            primary: true
          },
          {
            label: "Check Compliance Status",
            description: "Review your organization's current compliance progress and gaps"
          }
        ]}
        useCases={[
          "*ISO 27001 implementation* for *information security management systems*",
          "*ISO 42001 compliance* for *artificial intelligence management systems* and *governance*"
        ]}
        keyFeatures={[
          "**Comprehensive framework navigation** with *hierarchical clause structure*",
          "*Cross-referencing* between different *standards* and requirements",
          "*Progress tracking* and *compliance gap analysis* tools for implementation planning"
        ]}
        tips={[
          "Start with *gap analysis* to understand your *current compliance position*",
          "Focus on *foundational clauses* before moving to *specific technical requirements*",
          "Document your *implementation decisions* and evidence for *audit readiness*"
        ]}
      />
      <PageBreadcrumbs />
      <PageHeader
        title="Frameworks"
        description="This page provides an overview of available AI and data governance frameworks to your organization."
        rightContent={
          <HelperIcon
              onClick={() =>
              setIsHelperDrawerOpen(!isHelperDrawerOpen)
              }
              size="small"
            />
          }
       />

      {/* Only show framework content if organizational project exists */}
      {organizationalProject && (
        <TabContext value={mainTabValue}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }} data-joyride-id="framework-main-tabs">
            <TabList
              onChange={handleMainTabChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={tabListStyle}
            >
              <Tab
                label="Dashboard"
                value="dashboard"
                sx={tabStyle}
                disableRipple
              />
              <Tab
                label="Framework risks"
                value="framework-risks"
                sx={tabStyle}
                disableRipple
              />
              <Tab
                label="Linked models"
                value="linked-models"
                sx={tabStyle}
                disableRipple
              />
              <Tab
                label="Controls and Requirements"
                value="controls"
                sx={tabStyle}
                disableRipple
              />
              <Tab
                label="Settings"
                value="settings"
                sx={tabStyle}
                disableRipple
              />
            </TabList>
          </Box>

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
                    onChange={(value) => handleFrameworkSelect(parseInt(value))}
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
      )}

      {/* Show message when no organizational project exists */}
      {!organizationalProject && (
        <NoProject message="No Organizational Project Found. Create a new organizational project to manage ISO 27001 and ISO 42001 frameworks for your organization." />
      )}

      {/* Page Tour */}
      <PageTour steps={FrameworkSteps} run={true} tourKey="framework-tour" />
    </Stack>
  );
};

export default Framework;