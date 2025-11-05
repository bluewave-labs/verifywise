import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableFooter,
  Typography,
  useTheme,
  Box,
} from "@mui/material";
import useNavigateSearch from "../../../application/hooks/useNavigateSearch";
import singleTheme from "../../themes/v1SingleTheme";
import TablePaginationActions from "../../components/TablePagination";
import placeholderImage from "../../assets/imgs/empty-state.svg";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { IProjectTableViewProps } from "../../../domain/interfaces/i.project";
import { Project } from "../../../domain/types/Project";

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);

const PROJECT_ROWS_PER_PAGE_KEY = "verifywise_project_rows_per_page";
const PROJECT_SORTING_KEY = "verifywise_project_sorting";

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const columns = [
  { id: "title", label: "Use case title", minWidth: 200, sortable: true },
  { id: "risk", label: "AI Risk Level", minWidth: 130, sortable: true },
  { id: "role", label: "Role", minWidth: 150, sortable: true },
  { id: "startDate", label: "Start Date", minWidth: 120, sortable: true },
  { id: "lastUpdated", label: "Last Updated", minWidth: 120, sortable: true },
];

// Sortable Table Header Component
const SortableTableHeader: React.FC<{
  columns: typeof columns;
  sortConfig: SortConfig;
  onSort: (columnId: string) => void;
}> = ({ columns, sortConfig, onSort }) => {
  const theme = useTheme();

  return (
    <TableHead
      sx={{
        backgroundColor:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            sx={{
              ...singleTheme.tableStyles.primary.header.cell,
              minWidth: column.minWidth,
              cursor: "pointer",
              userSelect: "none",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
            onClick={() => column.sortable && onSort(column.id)}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing(2),
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: sortConfig.key === column.id ? "primary.main" : "inherit",
                }}
              >
                {column.label}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: sortConfig.key === column.id ? "primary.main" : "#9CA3AF",
                }}
              >
                {sortConfig.key === column.id && sortConfig.direction === "asc" && (
                  <ChevronUp size={16} />
                )}
                {sortConfig.key === column.id && sortConfig.direction === "desc" && (
                  <ChevronDown size={16} />
                )}
                {sortConfig.key !== column.id && (
                  <ChevronsUpDown size={16} />
                )}
              </Box>
            </Box>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

const ProjectTableView: React.FC<IProjectTableViewProps> = ({ projects }) => {
  const theme = useTheme();
  const navigate = useNavigateSearch();
  const [page, setPage] = useState(0);

  // Initialize rowsPerPage from localStorage or default to 10
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem(PROJECT_ROWS_PER_PAGE_KEY);
    return saved ? parseInt(saved, 10) : 10;
  });

  // Initialize sorting state from localStorage or default to no sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(PROJECT_SORTING_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { key: "", direction: null };
      }
    }
    return { key: "", direction: null };
  });

  // Save rowsPerPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(PROJECT_ROWS_PER_PAGE_KEY, rowsPerPage.toString());
  }, [rowsPerPage]);

  // Save sorting state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(PROJECT_SORTING_KEY, JSON.stringify(sortConfig));
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRiskColor = (risk: string) => {
    const style = (() => {
      switch (risk.toLowerCase()) {
        case "high risk":
          return { bg: "#ffcdd2", color: "#c62828" }; // light red bg, dark red text
        case "limited risk":
          return { bg: "#fff3e0", color: "#b71c1c" }; // light orange bg, brown text
        case "minimal risk":
          return { bg: "#c8e6c9", color: "#388e3c" }; // light green bg, dark green text
        default:
          return { bg: "#f5f5f5", color: "#9e9e9e" }; // default grey
      }
    })();

    return {
      backgroundColor: style.bg,
      color: style.color,
      padding: "4px 8px",
      borderRadius: "4px",
      fontWeight: 500,
      fontSize: "11px",
      textTransform: "uppercase" as const,
      display: "inline-block" as const,
      letterSpacing: "0.5px",
    };
  };

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const handleRowClick = (projectId: number) => {
    navigate("/project-view", { projectId: projectId.toString() });
  };

  // Sort the projects based on current sort configuration
  const sortedProjects = useMemo(() => {
    if (!projects || !sortConfig.key || !sortConfig.direction) {
      return projects || [];
    }

    const sortableProjects = [...projects];

    return sortableProjects.sort((a: Project, b: Project) => {
      // Risk level order: High > Limited > Minimal
      // Handle various possible formats of risk levels
      const getRiskValue = (risk: string) => {
        const riskLower = risk.toLowerCase().trim();
        if (riskLower.includes("high")) return 3;
        if (riskLower.includes("limited")) return 2;
        if (riskLower.includes("minimal")) return 1;
        return 0; // fallback for unknown risk levels
      };

      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case "title":
          aValue = a.project_title.toLowerCase();
          bValue = b.project_title.toLowerCase();
          break;

        case "risk":
          aValue = getRiskValue(a.ai_risk_classification);
          bValue = getRiskValue(b.ai_risk_classification);
          break;

        case "role":
          aValue = a.type_of_high_risk_role.toLowerCase();
          bValue = b.type_of_high_risk_role.toLowerCase();
          break;

        case "startDate":
          aValue = new Date(a.start_date).getTime();
          bValue = new Date(b.start_date).getTime();
          break;

        case "lastUpdated":
          aValue = new Date(a.last_updated).getTime();
          bValue = new Date(b.last_updated).getTime();
          break;

        default:
          return 0;
      }

      // Handle string comparisons
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      // Handle number comparisons
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [projects, sortConfig]);

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, sortedProjects.length);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, sortedProjects.length]);

  const paginatedProjects = useMemo(() => {
    return sortedProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedProjects, page, rowsPerPage]);

  if (!projects || projects.length === 0) {
    return (
      <TableContainer>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          <SortableTableHeader
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={columns.length}
                align="center"
                style={{
                  padding: theme.spacing(15, 5),
                  paddingBottom: theme.spacing(20),
                }}
              >
                <img src={placeholderImage} alt="No use cases" />
                <Typography sx={{ fontSize: "13px", color: "#475467", mt: 2 }}>
                  A use case is a real-world scenario describing how an AI
                  system is applied within an organization. Currently you don't
                  have any use cases in this workspace.
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <Table sx={singleTheme.tableStyles.primary.frame}>
        <SortableTableHeader
          columns={columns}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
        <TableBody>
          {paginatedProjects.map((project) => (
            <TableRow
              key={project.id}
              onClick={() => handleRowClick(project.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  if (event.key === " ") {
                    event.preventDefault();
                  }
                  handleRowClick(project.id);
                }
              }}
              tabIndex={0}
              role="button"
              sx={{
                ...singleTheme.tableStyles.primary.body.row,
                cursor: "pointer",
                "&:last-child td, &:last-child th": {
                  border: 0,
                },
                "&:focus": {
                  outline: "none",
                },
              }}
            >
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {project.project_title}
              </TableCell>

              <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                <Box component="span" sx={getRiskColor(project.ai_risk_classification)}>
                  {project.ai_risk_classification}
                </Box>
              </TableCell>

              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  fontSize: "13px",
                  textTransform: "capitalize",
                }}
              >
                {project.type_of_high_risk_role.replace(/_/g, " ")}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  fontSize: "13px",
                  color: "#475467",
                }}
              >
                {formatDate(project.start_date)}
              </TableCell>
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  fontSize: "13px",
                  color: "#475467",
                }}
              >
                {formatDate(project.last_updated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow
            sx={{
              "& .MuiTableCell-root.MuiTableCell-footer": {
                paddingX: theme.spacing(8),
                paddingY: theme.spacing(4),
              },
            }}
          >
            <TableCell
              sx={{
                paddingX: theme.spacing(2),
                fontSize: 12,
                opacity: 0.7,
                color: theme.palette.text.tertiary,
              }}
            >
              Showing {getRange} of {sortedProjects.length} use case(s)
            </TableCell>
            <TablePagination
              count={sortedProjects.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 15, 20, 25]}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={(props) => (
                <TablePaginationActions {...props} />
              )}
              labelRowsPerPage="Use cases per page"
              labelDisplayedRows={({ page, count }) =>
                `Page ${page + 1} of ${Math.max(
                  0,
                  Math.ceil(count / rowsPerPage)
                )}`
              }
              slotProps={{
                select: {
                  MenuProps: {
                    keepMounted: true,
                    PaperProps: {
                      className: "pagination-dropdown",
                      sx: {
                        mt: 0,
                        mb: theme.spacing(2),
                      },
                    },
                    transformOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    anchorOrigin: { vertical: "top", horizontal: "left" },
                    sx: { mt: theme.spacing(-2) },
                  },
                  inputProps: { id: "pagination-dropdown" },
                  IconComponent: SelectorVertical,
                  sx: {
                    ml: theme.spacing(4),
                    mr: theme.spacing(12),
                    minWidth: theme.spacing(20),
                    textAlign: "left",
                    "&.Mui-focused > div": {
                      backgroundColor: theme.palette.background.main,
                    },
                  },
                },
              }}
              sx={{
                mt: theme.spacing(6),
                color: theme.palette.text.secondary,
                "& .MuiSelect-icon": {
                  width: "24px",
                  height: "fit-content",
                },
                "& .MuiSelect-select": {
                  width: theme.spacing(10),
                  borderRadius: theme.shape.borderRadius,
                  border: `1px solid ${theme.palette.border.light}`,
                  padding: theme.spacing(4),
                },
              }}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default ProjectTableView;
