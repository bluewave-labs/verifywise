import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Tab } from "@mui/material";
import { Project } from "../../../../domain/types/Project";
import { Framework } from "../../../../domain/types/Framework";
import { getEntityById } from "../../../../application/repository/entity.repository";
import FrameworkProgressCard from "./FrameworkProgressCard";
import AssignmentStatusCard from "./AssignmentStatusCard";
import StatusBreakdownCard from "./StatusBreakdownCard";
import ControlCategoriesCard from "./ControlCategoriesCard";
import AnnexOverviewCard from "./AnnexOverviewCard";

interface DashboardProps {
  organizationalProject: Project;
  filteredFrameworks: Framework[];
}

interface FrameworkData {
  frameworkId: number;
  frameworkName: string;
  projectFrameworkId: number;
  clauseProgress?: {
    totalSubclauses: number;
    doneSubclauses: number;
  };
  annexProgress?: {
    // ISO 27001 uses these fields
    totalAnnexControls?: number;
    doneAnnexControls?: number;
    // ISO 42001 uses these fields
    totalAnnexcategories?: number;
    doneAnnexcategories?: number;
  };
  assignmentStatus?: {
    assignedClauses: number;
    totalClauses: number;
    assignedAnnexes: number;
    totalAnnexes: number;
  };
  statusBreakdown?: {
    passing: number;
    failing: number;
    needsChanges: number;
    inReview: number;
    pending: number;
    inProgress: number;
  };
}

// Tab styles matching the existing Framework page design
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

const FrameworkDashboard = ({
  organizationalProject,
  filteredFrameworks,
}: DashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [frameworksData, setFrameworksData] = useState<FrameworkData[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchFrameworkData = async () => {
      if (!organizationalProject || filteredFrameworks.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const dataPromises = filteredFrameworks.map(async (framework) => {
          // Get project framework ID
          const projectFramework = organizationalProject.framework?.find(
            (f) => f.framework_id === Number(framework.id)
          );
          const projectFrameworkId = projectFramework?.project_framework_id || framework.id;

          const isISO27001 = framework.name.toLowerCase().includes("iso 27001");
          const isISO42001 = framework.name.toLowerCase().includes("iso 42001");

          let clauseProgress, annexProgress, assignmentStatus, statusBreakdown;

          if (isISO27001) {
            // Fetch ISO 27001 data
            try {
              const clauseProgressRes = await getEntityById({
                routeUrl: `/iso-27001/clauses/progress/${projectFrameworkId}`,
              });

              // Validate response structure and provide fallback data
              if (clauseProgressRes?.data) {
                clauseProgress = {
                  totalSubclauses: clauseProgressRes.data.totalSubclauses || 0,
                  doneSubclauses: clauseProgressRes.data.doneSubclauses || 0,
                };
              } else {
                console.warn(`Invalid clause progress response structure for ISO 27001 framework ${framework.id}`);
                clauseProgress = { totalSubclauses: 0, doneSubclauses: 0 };
              }
            } catch (error) {
              if (!abortController.signal.aborted) {
                console.error(`Error fetching ISO 27001 clause progress for framework ${framework.id}:`, {
                  error: error instanceof Error ? error.message : error,
                  projectFrameworkId,
                  frameworkName: framework.name,
                });
              }
              clauseProgress = { totalSubclauses: 0, doneSubclauses: 0 };
            }

            try {
              const annexProgressRes = await getEntityById({
                routeUrl: `/iso-27001/annexes/progress/${projectFrameworkId}`,
              });

              // Validate response structure and provide fallback data
              if (annexProgressRes?.data) {
                annexProgress = {
                  totalAnnexControls: annexProgressRes.data.totalAnnexControls || 0,
                  doneAnnexControls: annexProgressRes.data.doneAnnexControls || 0,
                };
              } else {
                console.warn(`Invalid annex progress response structure for ISO 27001 framework ${framework.id}`);
                annexProgress = { totalAnnexControls: 0, doneAnnexControls: 0 };
              }
            } catch (error) {
              if (!abortController.signal.aborted) {
                console.error(`Error fetching ISO 27001 annex progress for framework ${framework.id}:`, {
                  error: error instanceof Error ? error.message : error,
                  projectFrameworkId,
                  frameworkName: framework.name,
                });
              }
              annexProgress = { totalAnnexControls: 0, doneAnnexControls: 0 };
            }
          } else if (isISO42001) {
            // Fetch ISO 42001 data
            try {
              const clauseProgressRes = await getEntityById({
                routeUrl: `/iso-42001/clauses/progress/${projectFrameworkId}`,
              });

              // Validate response structure and provide fallback data
              if (clauseProgressRes?.data) {
                clauseProgress = {
                  totalSubclauses: clauseProgressRes.data.totalSubclauses || 0,
                  doneSubclauses: clauseProgressRes.data.doneSubclauses || 0,
                };
              } else {
                console.warn(`Invalid clause progress response structure for ISO 42001 framework ${framework.id}`);
                clauseProgress = { totalSubclauses: 0, doneSubclauses: 0 };
              }
            } catch (error) {
              if (!abortController.signal.aborted) {
                console.error(`Error fetching ISO 42001 clause progress for framework ${framework.id}:`, {
                  error: error instanceof Error ? error.message : error,
                  projectFrameworkId,
                  frameworkName: framework.name,
                });
              }
              clauseProgress = { totalSubclauses: 0, doneSubclauses: 0 };
            }

            try {
              const annexProgressRes = await getEntityById({
                routeUrl: `/iso-42001/annexes/progress/${projectFrameworkId}`,
              });

              // Validate response structure and provide fallback data
              if (annexProgressRes?.data) {
                annexProgress = {
                  totalAnnexcategories: annexProgressRes.data.totalAnnexcategories || 0,
                  doneAnnexcategories: annexProgressRes.data.doneAnnexcategories || 0,
                };
              } else {
                console.warn(`Invalid annex progress response structure for ISO 42001 framework ${framework.id}`);
                annexProgress = { totalAnnexcategories: 0, doneAnnexcategories: 0 };
              }
            } catch (error) {
              if (!abortController.signal.aborted) {
                console.error(`Error fetching ISO 42001 annex progress for framework ${framework.id}:`, {
                  error: error instanceof Error ? error.message : error,
                  projectFrameworkId,
                  frameworkName: framework.name,
                });
              }
              annexProgress = { totalAnnexcategories: 0, doneAnnexcategories: 0 };
            }
          }

          return {
            frameworkId: Number(framework.id),
            frameworkName: framework.name,
            projectFrameworkId: Number(projectFrameworkId),
            clauseProgress,
            annexProgress,
            assignmentStatus,
            statusBreakdown,
          };
        });

        const data = await Promise.all(dataPromises);
        setFrameworksData(data);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching framework data:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchFrameworkData();

    return () => {
      abortController.abort();
    };
  }, [organizationalProject, filteredFrameworks]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (frameworksData.length === 0) {
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
        <Typography variant="body1" color="text.secondary">
          No frameworks enabled for this organization.
        </Typography>
      </Box>
    );
  }

  // Determine which frameworks are available
  const hasISO27001 = frameworksData.some(f => f.frameworkName.toLowerCase().includes("iso 27001"));
  const hasISO42001 = frameworksData.some(f => f.frameworkName.toLowerCase().includes("iso 42001"));

  // Create tabs array with ISO 42001 first, then ISO 27001
  const tabs: { id: string; label: string }[] = [];
  if (hasISO42001) tabs.push({ id: 'iso42001', label: 'ISO 42001' });
  if (hasISO27001) tabs.push({ id: 'iso27001', label: 'ISO 27001' });

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    const newIndex = tabs.findIndex(tab => tab.id === newValue);
    setActiveTab(newIndex);
  };

  return (
    <Stack spacing={0}>
      {/* Framework Progress, Assignment Status, and Status Breakdown in a row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
          },
          gap: "16px",
        }}
      >
        <FrameworkProgressCard frameworksData={frameworksData} />
        <AssignmentStatusCard frameworksData={frameworksData} />
        <StatusBreakdownCard frameworksData={frameworksData} />
      </Box>

      {/* Spacer to add extra gap */}
      <Box sx={{ height: "16px" }} />

      {/* Tab Bar - only show if we have frameworks */}
      {tabs.length > 0 && (
        <TabContext value={tabs[activeTab]?.id || tabs[0]?.id}>
          <Box>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <TabList
                onChange={handleTabChange}
                TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
                sx={tabListStyle}
              >
                {tabs.map(tab => (
                  <Tab
                    key={tab.id}
                    label={tab.label}
                    value={tab.id}
                    sx={tabStyle}
                    disableRipple
                  />
                ))}
              </TabList>
            </Box>
            {/* 16px spacing after tab bar */}
            <Box sx={{ height: "16px" }} />
          </Box>

          {/* Tab Panels */}
          <TabPanel value="iso42001" sx={tabPanelStyle}>
            <Stack spacing={0}>
              {/* ISO 42001 Clauses Overview */}
              <ControlCategoriesCard
                frameworksData={frameworksData.filter(f => f.frameworkName.toLowerCase().includes("iso 42001"))}
              />

              {/* 16px spacing before annexes */}
              <Box sx={{ height: "16px" }} />

              {/* ISO 42001 Annexes Overview */}
              <AnnexOverviewCard
                frameworksData={frameworksData.filter(f => f.frameworkName.toLowerCase().includes("iso 42001"))}
              />
            </Stack>
          </TabPanel>

          <TabPanel value="iso27001" sx={tabPanelStyle}>
            <Stack spacing={0}>
              {/* ISO 27001 Clauses Overview */}
              <ControlCategoriesCard
                frameworksData={frameworksData.filter(f => f.frameworkName.toLowerCase().includes("iso 27001"))}
              />

              {/* 16px spacing before annexes */}
              <Box sx={{ height: "16px" }} />

              {/* ISO 27001 Annexes Overview */}
              <AnnexOverviewCard
                frameworksData={frameworksData.filter(f => f.frameworkName.toLowerCase().includes("iso 27001"))}
              />
            </Stack>
          </TabPanel>
        </TabContext>
      )}

      {/* Fallback when no frameworks */}
      {!hasISO27001 && !hasISO42001 && (
        <ControlCategoriesCard frameworksData={frameworksData} />
      )}
    </Stack>
  );
};

export default FrameworkDashboard;
