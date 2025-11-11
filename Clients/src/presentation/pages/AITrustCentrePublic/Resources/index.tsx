import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
} from "@mui/material";
import {
  CheckCircle as CheckCircleOutlineIcon,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { downloadResource } from "../../../../application/tools/downloadResource";
import { aiTrustCenterTableCell } from "../style";

const RESOURCES_SORTING_KEY = "verifywise_resources_sorting";

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const Resources = ({
  data,
  loading,
  error,
  hash,
}: {
  data: any;
  loading: boolean;
  error: string | null;
  hash: string | null;
}) => {
  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!data || !data.resources || data.resources.length === 0)
    return <Typography>No resources available.</Typography>;

  // Initialize sorting state from localStorage or default to no sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(RESOURCES_SORTING_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { key: "", direction: null };
      }
    }
    return { key: "", direction: null };
  });

  // Save sorting state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(RESOURCES_SORTING_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  // Sorting handlers
  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === columnId) {
        // Toggle direction if same column, or clear if already descending
        if (prevConfig.direction === "asc") {
          return { key: columnId, direction: "desc" };
        } else if (prevConfig.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      // New column or first sort
      return { key: columnId, direction: "asc" };
    });
  }, []);

  // Sort the resources data based on current sort configuration
  const sortedResources = useMemo(() => {
    if (!data.resources || !sortConfig.key || !sortConfig.direction) {
      return data.resources || [];
    }

    const sortableData = [...data.resources];

    return sortableData.sort((a: any, b: any) => {
      // Handle different column types for resources
      const sortKey = sortConfig.key.trim().toLowerCase();

      if (sortKey.includes("document") || sortKey.includes("name")) {
        const aValue = a.name?.toLowerCase() || "";
        const bValue = b.name?.toLowerCase() || "";
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      } else {
        // Don't sort by action column
        return 0;
      }
    });
  }, [data.resources, sortConfig]);

  const handleDownload = async (id: string) => {
    if (hash) {
      await downloadResource(id, hash);
    }
  };

  return (
    <Box width="100%">
      <Typography
        variant="subtitle2"
        color="#13715B"
        sx={{ fontWeight: 600, mb: 2 }}
      >
        Resources
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ border: "1px solid #EEEEEE", borderRadius: 1, boxShadow: "none" }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#FAFAFA" }}>
              <TableCell
                sx={{
                  fontWeight: 400,
                  color: "#667085",
                  fontSize: 12,
                  textTransform: "uppercase",
                  paddingLeft: 4,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
                onClick={() => handleSort("document name")}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  document name
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color:
                        sortConfig.key === "document name"
                          ? "#1976D2"
                          : "#9CA3AF",
                    }}
                  >
                    {sortConfig.key === "document name" &&
                      sortConfig.direction === "asc" && <ChevronUp size={16} />}
                    {sortConfig.key === "document name" &&
                      sortConfig.direction === "desc" && (
                        <ChevronDown size={16} />
                      )}
                    {sortConfig.key !== "document name" && (
                      <ChevronsUpDown size={16} />
                    )}
                  </Box>
                </Box>
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 400,
                  color: "#667085",
                  fontSize: 12,
                  textTransform: "uppercase",
                  paddingRight: 11,
                }}
                align="right"
              >
                action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedResources.map((resource: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell
                  sx={{
                    ...aiTrustCenterTableCell,
                    backgroundColor: sortConfig.key === "document name" ? "#e8e8e8" : "#fafafa",
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleOutlineIcon
                      size={24}
                      style={{ color: "#10B981" }}
                    />
                    <Typography color="#344054" sx={{ fontSize: 13 }}>
                      {resource.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    ...aiTrustCenterTableCell,
                    backgroundColor: sortConfig.key === "action" ? "#f5f5f5" : "inherit",
                  }}
                >
                  <Button
                    onClick={() => handleDownload(resource.id)}
                    size="small"
                    sx={{
                      fontSize: 13,
                      minWidth: 100,
                      backgroundColor: "#fff",
                      color: "#344054",
                      border: "1px solid #D0D5DD",
                      borderRadius: 1,
                    }}
                  >
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Resources;
