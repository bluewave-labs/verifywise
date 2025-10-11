import { Box, Typography, Stack } from "@mui/material";
import { CircleDashed, CircleDot, CircleDotDashed, CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { GetClausesByProjectFrameworkId } from "../../../../application/repository/clause_struct_iso.repository";
import { GetAnnexesByProjectFrameworkId } from "../../../../application/repository/annex_struct_iso.repository";

/**
 * Assignment Status Card Component
 *
 * Displays assignment statistics for ISO 27001 and ISO 42001 frameworks.
 * Shows total vs assigned counts for both clauses and annexes, with visual indicators
 * for assignment completion status.
 *
 * Features:
 * - Real-time assignment count retrieval from dedicated assignment endpoints
 * - Framework-specific terminology (Controls/Clauses, Annexes)
 * - Visual status indicators with color-coded completion levels
 * - Defensive error handling and loading states
 */

/** Framework data structure from parent component */
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
}



/** Assignment statistics for a framework */
interface AssignmentCounts {
  clauseAssigned: number;
  clauseTotal: number;
  annexAssigned: number;
  annexTotal: number;
}

/** Component props */
interface AssignmentStatusCardProps {
  frameworksData: FrameworkData[];
}

const AssignmentStatusCard = ({ frameworksData }: AssignmentStatusCardProps) => {
  const [assignmentCounts, setAssignmentCounts] = useState<Map<number, AssignmentCounts>>(new Map());
  const [loading, setLoading] = useState(true);

  /**
   * Fetches assignment data for all frameworks
   * Uses dedicated assignment endpoints to get accurate owner-based counts
   */
  useEffect(() => {
    const fetchAssignmentData = async () => {
      setLoading(true);

      try {
        const countsMap = new Map<number, AssignmentCounts>();

        // Process each framework sequentially to fetch assignment data
        for (const framework of frameworksData) {
          const isISO27001 = framework.frameworkName.toLowerCase().includes("iso 27001");

          let clauseAssigned = 0;
          let clauseTotal = 0;
          let annexAssigned = 0;
          let annexTotal = 0;

          // Fetch clauses assignment data from dedicated assignment endpoints
          try {
            const routeUrl = isISO27001
              ? `/iso-27001/clauses/assignments/${framework.projectFrameworkId}`
              : `/iso-42001/clauses/assignments/${framework.projectFrameworkId}`;

            const clausesResponse = await GetClausesByProjectFrameworkId({ routeUrl });

            // Parse assignment count response (direct data access for clauses)
            if (clausesResponse?.data) {
              clauseTotal = clausesResponse.data.totalSubclauses || 0;
              clauseAssigned = clausesResponse.data.assignedSubclauses || 0;
            }

          } catch (error) {
            console.error(`Error fetching clause assignments for framework ${framework.frameworkId}:`, error);
          }

          // Fetch annexes assignment data from dedicated assignment endpoints
          try {
            const routeUrl = isISO27001
              ? `/iso-27001/annexes/assignments/${framework.projectFrameworkId}`
              : `/iso-42001/annexes/assignments/${framework.projectFrameworkId}`;

            const annexesResponse = await GetAnnexesByProjectFrameworkId({ routeUrl });

            // Parse assignment count response (nested data access for annexes due to API structure)
            if (annexesResponse?.data?.data) {
              if (isISO27001) {
                annexTotal = annexesResponse.data.data.totalAnnexControls || 0;
                annexAssigned = annexesResponse.data.data.assignedAnnexControls || 0;
              } else {
                // ISO 42001
                annexTotal = annexesResponse.data.data.totalAnnexcategories || 0;
                annexAssigned = annexesResponse.data.data.assignedAnnexcategories || 0;
              }
            }

          } catch (error) {
            console.error(`Error fetching annex assignments for framework ${framework.frameworkId}:`, error);
          }

          // Store assignment counts for this framework
          countsMap.set(framework.frameworkId, {
            clauseAssigned,
            clauseTotal,
            annexAssigned,
            annexTotal,
          });
        }

        setAssignmentCounts(countsMap);
      } catch (error) {
        console.error("Error fetching assignment data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data when frameworks are available
    if (frameworksData.length > 0) {
      fetchAssignmentData();
    }
  }, [frameworksData]);

  /**
   * Returns appropriate status icon based on assignment completion percentage
   *
   * @param done - Number of items assigned
   * @param total - Total number of items
   * @returns React component with colored icon representing completion status
   *
   * Icon Color Legend:
   * - Gray: No items available (total = 0)
   * - Red: 0-29% complete (Critical - needs immediate attention)
   * - Orange: 30-59% complete (Warning - requires action)
   * - Yellow: 60-84% complete (Good progress - monitor)
   * - Green: 85-99% complete (Almost complete - final push)
   * - Green Check: 100% complete (Fully assigned)
   */
  const getAssignmentIcon = (done: number, total: number) => {
    if (total === 0) return <CircleDashed size={14} style={{ color: "#9CA3AF" }} />;
    const percentage = (done / total) * 100;
    if (percentage === 0) return <CircleDashed size={14} style={{ color: "#DC2626" }} />;
    if (percentage < 30) return <CircleDashed size={14} style={{ color: "#DC2626" }} />;
    if (percentage < 60) return <CircleDot size={14} style={{ color: "#EA580C" }} />;
    if (percentage < 85) return <CircleDotDashed size={14} style={{ color: "#F59E0B" }} />;
    if (percentage < 100) return <CircleDotDashed size={14} style={{ color: "#13715B" }} />;
    return <CircleCheck size={14} style={{ color: "#13715B" }} />;
  };
  return (
    <Box
      sx={{
        border: "1px solid #EEEEEE",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          backgroundColor: "#F1F3F4",
          p: "10px 16px",
          borderBottom: "1px solid #EEEEEE",
        }}
      >
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: "#000000",
            lineHeight: "16px",
            m: 0,
          }}
        >
          Assignment status
        </Typography>
      </Box>

      {/* Content Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
          p: "16px",
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            color: "#666666",
            mb: 6,
            lineHeight: "16px"
          }}
        >
          Monitor task assignment coverage for clauses and annexes. Displays how many items have been assigned to team members.
        </Typography>

      <Stack spacing={5}>
        {frameworksData.map((framework) => {
          // Detect framework type for appropriate API endpoints and terminology
          const isISO27001 = framework.frameworkName.toLowerCase().includes("iso 27001");
          const isISO42001 = framework.frameworkName.toLowerCase().includes("iso 42001");

          const counts = assignmentCounts.get(framework.frameworkId);

          // Show loading state while data is being fetched
          if (loading || !counts) {
            return (
              <Box key={framework.frameworkId}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    mb: 2,
                    color: "#000000",
                  }}
                >
                  {framework.frameworkName}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#666666" }}>
                  Loading assignment data...
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
                  mb: 2,
                  color: "#000000",
                }}
              >
                {framework.frameworkName}
              </Typography>

              <Stack spacing={1.5}>
                {/* Clauses Assignment Display - Shows subclauses assignment status */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: "#666666" }}>
                    {/* Use appropriate terminology based on framework type */}
                    {isISO27001 || isISO42001 ? "Clauses" : "Controls"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Status icon with color-coded completion indicator */}
                    {getAssignmentIcon(counts.clauseAssigned, counts.clauseTotal)}
                    <Typography sx={{ fontSize: 12, color: "#000000", fontWeight: 500 }}>
                      {counts.clauseAssigned}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#000000", fontWeight: 500 }}>
                      /
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#999999", fontWeight: 500 }}>
                      {counts.clauseTotal}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#666666", fontWeight: 400, ml: 1 }}>
                      assigned
                    </Typography>
                  </Box>
                </Box>

                {/* Annexes Assignment Display - Shows annex controls/categories assignment status */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: "#666666" }}>
                    {/* All frameworks use "Annexes" terminology */}
                    {isISO27001 ? "Annexes" : isISO42001 ? "Annexes" : "Annexes"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Status icon with color-coded completion indicator */}
                    {getAssignmentIcon(counts.annexAssigned, counts.annexTotal)}
                    <Typography sx={{ fontSize: 12, color: "#000000", fontWeight: 500 }}>
                      {counts.annexAssigned}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#000000", fontWeight: 500 }}>
                      /
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#999999", fontWeight: 500 }}>
                      {counts.annexTotal}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#666666", fontWeight: 400, ml: 1 }}>
                      assigned
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>
      </Box>
    </Box>
  );
};

export default AssignmentStatusCard;
