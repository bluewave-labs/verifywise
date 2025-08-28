import { Stack, Typography, Box } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";
import useFrameworks from "../../../application/hooks/useFrameworks";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Tab } from "@mui/material";
import ISO27001Clause from "./ISO27001/Clause";
import ISO27001Annex from "./ISO27001/Annex";
import TabFilterBar from "../../components/FrameworkFilter/TabFilterBar";

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
  mb: 4,
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
  const { changeComponentVisibility } = useContext(VerifyWiseContext);
  const { refs, allVisible } = useMultipleOnScreen<HTMLElement>({
    countToTrigger: 1,
  });

  // Fetch all frameworks
  const { allFrameworks, loading, error } = useFrameworks({
    listOfFrameworks: [], // Empty array to get all frameworks
  });

  // Filter out EU AI Act frameworks and keep only ISO 27001 for now
  const filteredFrameworks = allFrameworks.filter(
    (framework) =>
      !framework.name.toLowerCase().includes("eu ai act") &&
      framework.name.toLowerCase().includes("iso 27001")
  );

  const [selectedFramework, setSelectedFramework] = useState<number>(0);
  const [iso27001TabValue, setIso27001TabValue] = useState("clause");

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
    { value: "audited", label: "Audited" },
    { value: "needs rework", label: "Needs Rework" },
  ];

  useEffect(() => {
    if (allVisible) {
      changeComponentVisibility("projectFrameworks", true);
    }
  }, [allVisible, changeComponentVisibility]);

  // Reset filters when tab changes (following ProjectFrameworks pattern)
  useEffect(() => {
    setStatusFilter("");
    setApplicabilityFilter("");
  }, [iso27001TabValue]);

  const handleFrameworkSelect = (index: number) => {
    setSelectedFramework(index);
  };

  const handleIso27001TabChange = (
    _: React.SyntheticEvent,
    newValue: string
  ) => {
    setIso27001TabValue(newValue);
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

    if (error || !filteredFrameworks.length) {
      return (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="body1" color="error">
            No frameworks available at the moment.
          </Typography>
        </Box>
      );
    }

    const framework = filteredFrameworks[selectedFramework];
    if (!framework) return null;

    // Check if the selected framework is ISO 27001
    const isISO27001 = framework.name.toLowerCase().includes("iso 27001");

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
                FrameworkId={framework.id}
                statusFilter={statusFilter}
              />
            </TabPanel>

            <TabPanel value="annex" sx={tabPanelStyle}>
              <ISO27001Annex
                FrameworkId={framework.id.toString()}
                statusFilter={statusFilter}
                applicabilityFilter={applicabilityFilter}
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
    <Stack
      className="framework-page"
      sx={{
        minHeight: "100vh",
        padding: 3,
        backgroundColor: "#FCFCFD",
      }}
      ref={refs[0]}
    >
      <Stack>
        <Typography sx={vwhomeHeading}>Framework</Typography>
        <Typography sx={singleTheme.textStyles.pageDescription}>
          This page provides an overview of available AI compliance frameworks.
          Explore different frameworks to understand their requirements and
          implementation guidelines.
        </Typography>
      </Stack>

      <Stack className="frameworks-switch" sx={{ mt: 6 }}>
        {/* Framework toggle following ProjectFrameworks pattern */}
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

        {/* Content that changes based on selected framework */}
        {renderFrameworkContent()}
      </Stack>
    </Stack>
  );
};

export default Framework;
