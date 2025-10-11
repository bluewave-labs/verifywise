import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import {
  Building2,
  Crown,
  ClipboardList,
  Wrench,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Cog,
  Activity,
  Zap
} from "lucide-react";
import {
  GetClausesByProjectFrameworkId,
  Iso27001GetClauseStructByFrameworkID
} from "../../../../application/repository/clause_struct_iso.repository";
import type { LucideIcon } from "lucide-react";
import { getStatusColor } from "../../ISO/style";

interface FrameworkData {
  frameworkId: number;
  frameworkName: string;
  projectFrameworkId: number;
}

interface ControlCategoriesCardProps {
  frameworksData: FrameworkData[];
}

interface ClauseData {
  id: number;
  title: string;
  clause_no: string;
  arrangement: string;
  subClauses: SubClauseData[];
}

interface SubClauseData {
  id: number;
  title: string;
  status: string;
  owner?: number | null;
}

interface CategoryData {
  id: number;
  number: string;
  name: string;
  icon: LucideIcon;
  subClauses: SubClauseData[];
  completionPercentage: number;
  assignmentPercentage: number;
}

// Predefined mappings for ISO 42001 clauses 4-10
const ISO42001_CLAUSE_MAPPINGS = {
  4: { number: "A.4", name: "Context of the organization", icon: Building2 },
  5: { number: "A.5", name: "Leadership", icon: Crown },
  6: { number: "A.6", name: "Planning", icon: ClipboardList },
  7: { number: "A.7", name: "Support", icon: Wrench },
  8: { number: "A.8", name: "Operation", icon: Settings },
  9: { number: "A.9", name: "Performance evaluation", icon: BarChart3 },
  10: { number: "A.10", name: "Improvement", icon: TrendingUp },
};

// Predefined mappings for ISO 27001 clauses 4-10
const ISO27001_CLAUSE_MAPPINGS = {
  4: { number: "A.4", name: "Context of the organization", icon: Building2 },
  5: { number: "A.5", name: "Leadership", icon: Crown },
  6: { number: "A.6", name: "Planning", icon: Target },
  7: { number: "A.7", name: "Support", icon: Users },
  8: { number: "A.8", name: "Operation", icon: Cog },
  9: { number: "A.9", name: "Performance evaluation", icon: Activity },
  10: { number: "A.10", name: "Improvement", icon: Zap },
};

const ControlCategoriesCard = ({ frameworksData }: ControlCategoriesCardProps) => {
  const [loading, setLoading] = useState(true);
  const [iso42001CategoriesData, setIso42001CategoriesData] = useState<CategoryData[]>([]);
  const [iso27001CategoriesData, setIso27001CategoriesData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const fetchControlCategoriesData = async () => {
      setLoading(true);

      try {
        if (!frameworksData || frameworksData.length === 0) {
          return;
        }

        // Find both frameworks
        const iso42001Framework = frameworksData.find((framework) =>
          framework.frameworkId === 2 || // Use framework ID as primary
          framework.frameworkName.toLowerCase().replace(/[\s-]/g, '').includes('iso42001')
        );

        const iso27001Framework = frameworksData.find((framework) =>
          framework.frameworkId === 3 || // Use framework ID as primary
          framework.frameworkName.toLowerCase().replace(/[\s-]/g, '').includes('iso27001')
        );

        // Fetch ISO 42001 data if framework is present
        if (iso42001Framework) {
          try {
            const clausesResponse = await GetClausesByProjectFrameworkId({
              routeUrl: `/iso-42001/clauses/struct/byProjectId/${iso42001Framework.projectFrameworkId}`,
            });

            const clauses: ClauseData[] = clausesResponse;

            // Filter clauses 4-10 only and process them directly
            const targetClauses = clauses.filter((clause) => {
              const clauseNum = parseInt(clause.clause_no);
              return clauseNum >= 4 && clauseNum <= 10;
            });

            // Process ISO 42001 clauses
            const iso42001Categories = targetClauses.map((clause) => {
              const clauseNum = parseInt(clause.clause_no);
              const mapping = ISO42001_CLAUSE_MAPPINGS[clauseNum as keyof typeof ISO42001_CLAUSE_MAPPINGS];

              const subClausesWithStatus: SubClauseData[] = clause.subClauses.map((sub: any) => ({
                id: sub.id,
                title: sub.title || "Untitled",
                status: sub.status || "Not started",
                owner: sub.owner || null,
              }));

              // Calculate completion percentage (implemented subclauses)
              const implementedCount = subClausesWithStatus.filter(
                (sub) => sub.status === "Implemented"
              ).length;
              const completionPercentage = subClausesWithStatus.length > 0
                ? Math.round((implementedCount / subClausesWithStatus.length) * 100)
                : 0;

              // Calculate assignment percentage (subclauses with owner assigned)
              const assignedCount = subClausesWithStatus.filter(
                (sub) => sub.owner !== null && sub.owner !== undefined
              ).length;
              const assignmentPercentage = subClausesWithStatus.length > 0
                ? Math.round((assignedCount / subClausesWithStatus.length) * 100)
                : 0;

              return {
                id: clause.id,
                number: mapping?.number || clauseNum.toString(),
                name: mapping?.name || clause.title,
                icon: mapping?.icon || Building2,
                subClauses: subClausesWithStatus,
                completionPercentage,
                assignmentPercentage,
              };
            });

            setIso42001CategoriesData(iso42001Categories);
          } catch (error) {
            console.error("Error fetching ISO 42001 categories data:", error);
            setIso42001CategoriesData([]);
          }
        }

        // Fetch ISO 27001 data if framework is present
        if (iso27001Framework) {
          try {
            const clausesResponse = await Iso27001GetClauseStructByFrameworkID({
              routeUrl: `/iso-27001/clauses/struct/byProjectId/${iso27001Framework.projectFrameworkId}`,
            });

            // Handle different response structure for ISO 27001
            const clauses: ClauseData[] = clausesResponse.data || clausesResponse;

            // Filter clauses 4-10 only and process them directly
            // ISO 27001 uses 'arrangement' field instead of 'clause_no'
            const targetClauses = clauses.filter((clause: any) => {
              const clauseNum = parseInt(clause.arrangement || clause.clause_no);
              return clauseNum >= 4 && clauseNum <= 10;
            });

            // Process ISO 27001 clauses
            const iso27001Categories = targetClauses.map((clause: any) => {
              const clauseNum = parseInt(clause.arrangement || clause.clause_no);
              const mapping = ISO27001_CLAUSE_MAPPINGS[clauseNum as keyof typeof ISO27001_CLAUSE_MAPPINGS];

              const subClausesWithStatus: SubClauseData[] = clause.subClauses.map((sub: any) => ({
                id: sub.id,
                title: sub.title || "Untitled",
                status: sub.status || "Not started",
                owner: sub.owner || null,
              }));

              // Calculate completion percentage (implemented subclauses)
              const implementedCount = subClausesWithStatus.filter(
                (sub) => sub.status === "Implemented"
              ).length;
              const completionPercentage = subClausesWithStatus.length > 0
                ? Math.round((implementedCount / subClausesWithStatus.length) * 100)
                : 0;

              // Calculate assignment percentage (subclauses with owner assigned)
              const assignedCount = subClausesWithStatus.filter(
                (sub) => sub.owner !== null && sub.owner !== undefined
              ).length;
              const assignmentPercentage = subClausesWithStatus.length > 0
                ? Math.round((assignedCount / subClausesWithStatus.length) * 100)
                : 0;

              return {
                id: clause.id,
                number: mapping?.number || clauseNum.toString(),
                name: mapping?.name || clause.title,
                icon: mapping?.icon || Building2,
                subClauses: subClausesWithStatus,
                completionPercentage,
                assignmentPercentage,
              };
            });

            setIso27001CategoriesData(iso27001Categories);
          } catch (error) {
            console.error("Error fetching ISO 27001 categories data:", error);
            setIso27001CategoriesData([]);
          }
        }
      } catch (error) {
        console.error("Error fetching control categories data:", error);
        setIso42001CategoriesData([]);
        setIso27001CategoriesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchControlCategoriesData();
  }, [frameworksData]);

  const renderMiniSquares = (subClauses: SubClauseData[]) => {
    if (subClauses.length === 0) {
      // Show a single empty placeholder if no subclauses
      return (
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "2px",
            backgroundColor: "#E5E7EB",
            border: "1px solid #D1D5DB",
          }}
        />
      );
    }

    // Create squares only for actual subclauses
    return subClauses.map((subClause, index) => (
      <Box
        key={index}
        sx={{
          width: 12,
          height: 12,
          borderRadius: "2px",
          backgroundColor: getStatusColor(subClause.status),
        }}
      />
    ));
  };

  const renderFrameworkSection = (categoriesData: CategoryData[], title: string) => {
    if (categoriesData.length === 0) return null;

    return (
      <Stack spacing={2}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: "#000000",
          }}
        >
          {title}
        </Typography>

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
          {categoriesData.map((category) => {
            const IconComponent = category.icon;
            return (
              <Box
                key={category.id}
                sx={{
                  border: "1px solid #EEEEEE",
                  borderRadius: "4px",
                  overflow: "hidden",
                  backgroundColor: "#FFFFFF",
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconComponent size={14} style={{ color: "#666666" }} />
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#000000",
                        lineHeight: "16px",
                        m: 0,
                      }}
                    >
                      {category.number}. {category.name}
                    </Typography>
                  </Box>
                </Box>

                {/* Content Section */}
                <Box
                  sx={{
                    background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
                    p: "16px",
                  }}
                >
                  {/* Mini squares grid */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "3px",
                      mb: 3,
                      maxWidth: "100%",
                      minHeight: "36px", // Allow for 3 rows minimum
                    }}
                  >
                    {renderMiniSquares(category.subClauses)}
                  </Box>

                  {/* Statistics */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#000000",
                          fontWeight: 600,
                        }}
                      >
                        {category.subClauses.filter(sub => sub.status === "Implemented").length}/
                        {category.subClauses.length}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#666666",
                        }}
                      >
                        subclauses implemented
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#000000",
                          fontWeight: 600,
                        }}
                      >
                        {category.subClauses.filter(sub => sub.owner !== null && sub.owner !== undefined).length}/
                        {category.subClauses.length}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#666666",
                        }}
                      >
                        assigned
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Stack>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If no data for either framework
  if (iso42001CategoriesData.length === 0 && iso27001CategoriesData.length === 0) {
    return (
      <Box
        sx={{
          textAlign: "center",
          py: 4,
          backgroundColor: "#F9FAFB",
          borderRadius: 2,
          border: "1px solid #E5E7EB",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No ISO framework clauses data available.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={0}>
      {/* Render ISO 42001 section if data is available */}
      {renderFrameworkSection(iso42001CategoriesData, "ISO 42001 clauses overview")}

      {/* Add 16px spacing between sections when both are present */}
      {iso42001CategoriesData.length > 0 && iso27001CategoriesData.length > 0 && (
        <Box sx={{ height: "16px" }} />
      )}

      {/* Render ISO 27001 section if data is available */}
      {renderFrameworkSection(iso27001CategoriesData, "ISO 27001 clauses overview")}
    </Stack>
  );
};

export default ControlCategoriesCard;