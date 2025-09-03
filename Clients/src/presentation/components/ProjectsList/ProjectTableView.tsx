import React, { useState, useMemo, useCallback } from "react";
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
} from "@mui/material";
import useNavigateSearch from "../../../application/hooks/useNavigateSearch";
import { Project } from "../../../domain/types/Project";
import singleTheme from "../../themes/v1SingleTheme";
import TablePaginationActions from "../../components/TablePagination";
import placeholderImage from "../../assets/imgs/empty-state.svg";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";

interface ProjectTableViewProps {
  projects: Project[];
}

const ProjectTableView: React.FC<ProjectTableViewProps> = ({ projects }) => {
  const theme = useTheme();
  const navigate = useNavigateSearch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = [
    { id: "title", label: "Project Title", minWidth: 200 },
    { id: "risk", label: "AI Risk Level", minWidth: 130 },
    { id: "role", label: "Role", minWidth: 150 },
    { id: "startDate", label: "Start Date", minWidth: 120 },
    { id: "lastUpdated", label: "Last Updated", minWidth: 120 },
  ];

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
          return { bg: "#ffcdd2", color: "#c62828" };       // light red bg, dark red text
        case "limited risk":
          return { bg: "#fff3e0", color: "#fb8c00" };       // light orange bg, orange text
        case "minimal risk":
          return { bg: "#c8e6c9", color: "#388e3c" };       // light green bg, dark green text
        default:
          return { bg: "#f5f5f5", color: "#9e9e9e" };       // default grey
      }
    })();
  
    return {
      backgroundColor: style.bg,
      color: style.color,
      padding: "4px 8px",
      borderRadius: 12,
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

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, projects.length);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, projects.length]);

  const paginatedProjects = useMemo(() => {
    return projects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [projects, page, rowsPerPage]);

  if (!projects || projects.length === 0) {
    return (
      <TableContainer>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
            <TableRow sx={singleTheme.tableStyles.primary.header.row}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  style={{ minWidth: column.minWidth }}
                  sx={singleTheme.tableStyles.primary.header.cell}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
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
                <img src={placeholderImage} alt="No projects" />
                <Typography sx={{ fontSize: "13px", color: "#475467", mt: 2 }}>
                  A project is a use-case, AI product or an algorithm. Currently you don't have any projects in this workspace.
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
        <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
          <TableRow sx={singleTheme.tableStyles.primary.header.row}>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                style={{ minWidth: column.minWidth }}
                sx={singleTheme.tableStyles.primary.header.cell}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedProjects.map((project) => (
            <TableRow
              key={project.id}
              onClick={() => handleRowClick(project.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  if (event.key === ' ') {
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
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2,
                },
              }}
            >
              <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, fontSize: "13px", fontWeight: 500 }}>
                {project.project_title}
              </TableCell>

              <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                <span style={getRiskColor(project.ai_risk_classification)}>
                  {project.ai_risk_classification}
                </span>
              </TableCell>

              <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, fontSize: "13px", textTransform: "capitalize" }}>
                {project.type_of_high_risk_role.replace(/_/g, " ")}
              </TableCell>
              <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, fontSize: "13px", color: "#475467" }}>
                {formatDate(project.start_date)}
              </TableCell>
              <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, fontSize: "13px", color: "#475467" }}>
                {formatDate(project.last_updated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow sx={{
            '& .MuiTableCell-root.MuiTableCell-footer': {
              paddingX: theme.spacing(8),
              paddingY: theme.spacing(4),
            }
          }}>
            <TableCell
              sx={{ 
                paddingX: theme.spacing(2),
                fontSize: 12,
                opacity: 0.7,
                color: theme.palette.text.tertiary,
              }}
            >
              Showing {getRange} of {projects.length} project(s)
            </TableCell>
            <TablePagination
              count={projects.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 15, 20, 25]}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={(props) => (
                <TablePaginationActions {...props} />
              )}
              labelRowsPerPage="Projects per page"
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