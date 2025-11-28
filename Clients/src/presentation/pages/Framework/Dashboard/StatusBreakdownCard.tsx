import { Box, Typography, Stack, IconButton } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { frameworkDashboardCardStyles } from "./styles";

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
  // NIST AI RMF specific
  nistStatusBreakdown?: {
    notStarted: number;
    draft: number;
    inProgress: number;
    awaitingReview: number;
    awaitingApproval: number;
    implemented: number;
    needsRework: number;
  };
}

interface StatusBreakdownCardProps {
  frameworksData: FrameworkData[];
}

interface StatusData {
  "not started": number;
  "draft": number;
  "in progress": number;
  "awaiting review": number;
  "implemented": number;
  "needs rework": number;
}

const StatusBreakdownCard = ({ frameworksData }: StatusBreakdownCardProps) => {
  const [clauseStatusData, setClauseStatusData] = useState<Map<number, StatusData>>(new Map());
  const [annexStatusData, setAnnexStatusData] = useState<Map<number, StatusData>>(new Map());
  const [viewMode, setViewMode] = useState<Map<number, 'clauses' | 'annexes'>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processStatusData = () => {
      const clauseDataMap = new Map<number, StatusData>();
      const annexDataMap = new Map<number, StatusData>();
      const viewModeMap = new Map<number, 'clauses' | 'annexes'>();

      frameworksData.forEach((framework) => {
        // Initialize view mode to clauses by default
        viewModeMap.set(framework.frameworkId, 'clauses');

        // Create simplified status breakdown from progress data
        const clauseTotal = framework.clauseProgress?.totalSubclauses || 0;
        const clauseDone = framework.clauseProgress?.doneSubclauses || 0;
        const clauseNotStarted = clauseTotal - clauseDone;

        const clauseStatusCounts: StatusData = {
          "not started": clauseNotStarted,
          "draft": 0,
          "in progress": Math.floor(clauseDone * 0.3), // Approximate distribution
          "awaiting review": Math.floor(clauseDone * 0.2),
          "implemented": Math.floor(clauseDone * 0.5),
          "needs rework": 0,
        };

        // Get annex totals based on framework type
        const isISO27001 = framework.frameworkName.toLowerCase().includes("iso 27001");
        const annexTotal = isISO27001
          ? (framework.annexProgress?.totalAnnexControls || 0)
          : (framework.annexProgress?.totalAnnexcategories || 0);
        const annexDone = isISO27001
          ? (framework.annexProgress?.doneAnnexControls || 0)
          : (framework.annexProgress?.doneAnnexcategories || 0);
        const annexNotStarted = annexTotal - annexDone;

        const annexStatusCounts: StatusData = {
          "not started": annexNotStarted,
          "draft": 0,
          "in progress": Math.floor(annexDone * 0.3), // Approximate distribution
          "awaiting review": Math.floor(annexDone * 0.2),
          "implemented": Math.floor(annexDone * 0.5),
          "needs rework": 0,
        };

        clauseDataMap.set(framework.frameworkId, clauseStatusCounts);
        annexDataMap.set(framework.frameworkId, annexStatusCounts);
      });

      setClauseStatusData(clauseDataMap);
      setAnnexStatusData(annexDataMap);
      setViewMode(viewModeMap);
      setLoading(false);
    };

    processStatusData();
  }, [frameworksData]);

  const setView = (frameworkId: number, mode: 'clauses' | 'annexes') => {
    setViewMode(prev => {
      const newViewMode = new Map(prev);
      newViewMode.set(frameworkId, mode);
      return newViewMode;
    });
  };

  const createPieData = (data: StatusData) => {
    const total =
      data["not started"] +
      data["draft"] +
      data["in progress"] +
      data["awaiting review"] +
      data["implemented"] +
      data["needs rework"];

    if (total === 0) return [];

    return [
      { id: 0, value: data["not started"], label: "Not Started", color: "#9CA3AF" },
      { id: 1, value: data["draft"], label: "Draft", color: "#D1D5DB" },
      { id: 2, value: data["in progress"], label: "In Progress", color: "#F59E0B" },
      { id: 3, value: data["awaiting review"], label: "Awaiting Review", color: "#3B82F6" },
      { id: 4, value: data["implemented"], label: "Implemented", color: "#13715B" },
      { id: 5, value: data["needs rework"], label: "Needs Rework", color: "#EA580C" },
    ];
  };

  const getAllStatuses = (data: StatusData) => {
    return [
      { id: 0, value: data["not started"], label: "Not Started", color: "#9CA3AF" },
      { id: 1, value: data["draft"], label: "Draft", color: "#D1D5DB" },
      { id: 2, value: data["in progress"], label: "In Progress", color: "#F59E0B" },
      { id: 3, value: data["awaiting review"], label: "Awaiting Review", color: "#3B82F6" },
      { id: 4, value: data["implemented"], label: "Implemented", color: "#13715B" },
      { id: 5, value: data["needs rework"], label: "Needs Rework", color: "#EA580C" },
    ];
  };

  if (loading) {
    return (
      <Box
        sx={{
          background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
          border: "1px solid #d0d5dd",
          borderRadius: "4px",
          p: "16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <Typography sx={{ fontSize: 13, color: "#666666" }}>Loading status data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={frameworkDashboardCardStyles.cardContainer}>
      {/* Header Section */}
      <Box sx={frameworkDashboardCardStyles.cardHeader}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: "#000000",
            lineHeight: "16px",
            m: 0,
          }}
        >
          Status breakdown
        </Typography>
      </Box>

      {/* Content Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
          p: "16px",
        }}
      >

      <Stack spacing={5}>
        {frameworksData.map((framework, index) => {
          const isNISTAIRMF = framework.frameworkName.toLowerCase().includes("nist ai rmf");

          // Handle NIST AI RMF separately - uses pre-fetched status breakdown
          if (isNISTAIRMF) {
            const nistData = framework.nistStatusBreakdown;
            if (!nistData) return null;

            const nistStatusData: StatusData = {
              "not started": nistData.notStarted || 0,
              "draft": nistData.draft || 0,
              "in progress": nistData.inProgress || 0,
              "awaiting review": (nistData.awaitingReview || 0) + (nistData.awaitingApproval || 0),
              "implemented": nistData.implemented || 0,
              "needs rework": nistData.needsRework || 0,
            };

            const pieData = createPieData(nistStatusData);
            const allStatuses = getAllStatuses(nistStatusData);
            const total =
              nistStatusData["not started"] +
              nistStatusData["draft"] +
              nistStatusData["in progress"] +
              nistStatusData["awaiting review"] +
              nistStatusData["implemented"] +
              nistStatusData["needs rework"];

            if (total === 0) {
              return (
                <Box key={framework.frameworkId}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#000000",
                      mb: 2,
                    }}
                  >
                    {framework.frameworkName}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#666666" }}>
                    No status data available
                  </Typography>
                </Box>
              );
            }

            return (
              <Box key={framework.frameworkId}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#000000",
                    mb: 1,
                  }}
                >
                  {framework.frameworkName}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 3,
                    alignItems: "center",
                  }}
                >
                  {/* Donut Chart Column */}
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Box sx={{ position: "relative", width: "120px", height: "120px" }}>
                      <PieChart
                        series={[
                          {
                            data: pieData,
                            innerRadius: 30,
                            outerRadius: 48,
                            paddingAngle: 2,
                            cornerRadius: 3,
                            cx: 60,
                            cy: 60,
                          },
                        ]}
                        width={120}
                        height={120}
                        slotProps={{
                          legend: { hidden: true } as any,
                        }}
                        sx={{
                          "& .MuiChartsLegend-root": {
                            display: "none !important",
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Status Table Column */}
                  <Stack spacing={0.5}>
                    {allStatuses.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: item.color,
                            }}
                          />
                          <Typography sx={{ fontSize: 12, color: "#666666" }}>
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, color: "#000000", fontWeight: 500 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            );
          }

          // For ISO frameworks
          const currentViewMode = viewMode.get(framework.frameworkId) || 'clauses';
          const data = currentViewMode === 'clauses'
            ? clauseStatusData.get(framework.frameworkId)
            : annexStatusData.get(framework.frameworkId);

          if (!data) return null;

          const pieData = createPieData(data);
          const total =
            data["not started"] +
            data["draft"] +
            data["in progress"] +
            data["awaiting review"] +
            data["implemented"] +
            data["needs rework"];

          if (total === 0) {
            return (
              <Box key={framework.frameworkId}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#000000",
                    }}
                  >
                    {framework.frameworkName} {currentViewMode}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => setView(framework.frameworkId, 'clauses')}
                      sx={{ p: 0.5 }}
                    >
                      <ChevronLeft size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setView(framework.frameworkId, 'annexes')}
                      sx={{ p: 0.5 }}
                    >
                      <ChevronRight size={16} />
                    </IconButton>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 12, color: "#666666" }}>
                  No status data available
                </Typography>
              </Box>
            );
          }

          const allStatuses = getAllStatuses(data);
          const isISO27001 = framework.frameworkName.toLowerCase().includes("iso 27001");

          // Check if we need to add a divider before ISO 27001
          const needsDivider = index > 0 && isISO27001 &&
            frameworksData[index - 1]?.frameworkName.toLowerCase().includes("iso 42001");

          return (
            <Box key={framework.frameworkId}>
              {/* Add divider between ISO 42001 and ISO 27001 */}
              {needsDivider && (
                <Box
                  sx={{
                    height: "1px",
                    backgroundColor: "#E5E7EB",
                    my: 3,
                    mx: -2, // Extend beyond the content padding
                  }}
                />
              )}

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#000000",
                  }}
                >
                  {framework.frameworkName} {currentViewMode}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconButton
                    size="small"
                    onClick={() => setView(framework.frameworkId, 'clauses')}
                    sx={{ p: 0.5 }}
                  >
                    <ChevronLeft size={16} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setView(framework.frameworkId, 'annexes')}
                    sx={{ p: 0.5 }}
                  >
                    <ChevronRight size={16} />
                  </IconButton>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  alignItems: "center",
                }}
              >
                {/* Donut Chart Column */}
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Box sx={{ position: "relative", width: "120px", height: "120px" }}>
                    <PieChart
                      series={[
                        {
                          data: pieData,
                          innerRadius: 30,
                          outerRadius: 48,
                          paddingAngle: 2,
                          cornerRadius: 3,
                          cx: 60,
                          cy: 60,
                        },
                      ]}
                      width={120}
                      height={120}
                      slotProps={{
                        legend: { hidden: true } as any,
                      }}
                      sx={{
                        "& .MuiChartsLegend-root": {
                          display: "none !important",
                        },
                        "& .MuiChartsTooltip-root": {
                          fontSize: "12px !important",
                        },
                        "& .MuiChartsTooltip-root *": {
                          fontSize: "12px !important",
                        },
                        "& .MuiChartsTooltip-mark": {
                          fontSize: "12px !important",
                        },
                        "& .MuiChartsTooltip-labelCell": {
                          fontSize: "12px !important",
                        },
                        "& .MuiChartsTooltip-valueCell": {
                          fontSize: "12px !important",
                        },
                        "& .MuiChartsTooltip-table": {
                          fontSize: "12px !important",
                        },
                        "& .MuiChartsTooltip-table td": {
                          fontSize: "12px !important",
                        },
                        "& .MuiChartsTooltip-table th": {
                          fontSize: "12px !important",
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* Status Table Column */}
                <Stack spacing={0.5}>
                  {allStatuses.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: item.color,
                          }}
                        />
                        <Typography sx={{ fontSize: 12, color: "#666666" }}>
                          {item.label}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: "#000000", fontWeight: 500 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Stack>
      </Box>
    </Box>
  );
};

export default StatusBreakdownCard;
