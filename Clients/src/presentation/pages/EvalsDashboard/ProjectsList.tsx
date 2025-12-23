import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Chip,
  Stack,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableFooter,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Plus, Pencil, Trash2, FileSearch, MessageSquare, ChevronsUpDown, ChevronUp, ChevronDown, MoreVertical } from "lucide-react";
import SelectableCard from "../../components/SelectableCard";
import CustomizableButton from "../../components/Button/CustomizableButton";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Alert from "../../components/Alert";
import EmptyState from "../../components/EmptyState";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";
import TablePaginationActions from "../../components/TablePagination";
import SearchBox from "../../components/Search/SearchBox";
import { FilterBy, type FilterColumn } from "../../components/Table/FilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import singleTheme from "../../themes/v1SingleTheme";
import type { DeepEvalProject } from "./types";
import { useAuth } from "../../../application/hooks/useAuth";
import allowedRoles from "../../../application/constants/permissions";

const EVALS_PROJECTS_ROWS_PER_PAGE_KEY = "verifywise_evals_projects_rows_per_page";
const EVALS_PROJECTS_SORTING_KEY = "verifywise_evals_projects_sorting";

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const columns = [
  { id: "name", label: "Name", minWidth: 180, sortable: true, align: "left" as const },
  { id: "useCase", label: "Use case", minWidth: 120, sortable: true, align: "center" as const },
  { id: "description", label: "Description", minWidth: 200, sortable: false, align: "center" as const },
  { id: "runs", label: "Runs", minWidth: 100, sortable: true, align: "center" as const },
  { id: "created", label: "Created", minWidth: 140, sortable: true, align: "center" as const },
  { id: "actions", label: "Action", minWidth: 80, sortable: false, align: "center" as const },
];

export default function ProjectsList() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [projects, setProjects] = useState<DeepEvalProject[]>([]);
  const [runsByProject, setRunsByProject] = useState<Record<string, number>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    body: string;
  } | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem(EVALS_PROJECTS_ROWS_PER_PAGE_KEY);
    return saved ? parseInt(saved, 10) : 10;
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(EVALS_PROJECTS_SORTING_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { key: "", direction: null };
      }
    }
    return { key: "", direction: null };
  });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(EVALS_PROJECTS_ROWS_PER_PAGE_KEY, rowsPerPage.toString());
  }, [rowsPerPage]);

  useEffect(() => {
    localStorage.setItem(EVALS_PROJECTS_SORTING_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  // RBAC permissions
  const { userRoleName } = useAuth();
  const canCreateProject = allowedRoles.evals.createProject.includes(userRoleName);
  const canEditProject = allowedRoles.evals.editProject.includes(userRoleName);
  const canDeleteProject = allowedRoles.evals.deleteProject.includes(userRoleName);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");

  const filterColumns: FilterColumn[] = [
    { id: "name", label: "Project name", type: "text" },
    { id: "useCase", label: "Use case", type: "select", options: [
      { label: "Chatbot", value: "chatbot" },
      { label: "RAG", value: "rag" },
      { label: "Agent", value: "agent" },
    ]},
  ];

  const getFieldValue = useCallback(
    (project: DeepEvalProject, field: string): string => {
      switch (field) {
        case "name":
          return project.name;
        case "useCase":
          return project.useCase || "";
        default:
          return "";
      }
    },
    []
  );

  const { filterData, handleFilterChange } = useFilterBy<DeepEvalProject>(getFieldValue);

  const filteredProjects = useMemo(() => {
    const afterFilter = filterData(projects);
    if (!searchTerm.trim()) return afterFilter;
    const q = searchTerm.toLowerCase();
    return afterFilter.filter((p) =>
      [p.name, p.description, p.useCase]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [projects, filterData, searchTerm]);

  const [newProject, setNewProject] = useState<{ name: string; description: string; useCase: "chatbot" | "rag" | "agent" }>({
    name: "",
    description: "",
    useCase: "chatbot",
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DeepEvalProject | null>(null);
  const [editProjectData, setEditProjectData] = useState({
    name: "",
    description: "",
  });

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<DeepEvalProject | null>(null);

  // Action menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuProject, setMenuProject] = useState<DeepEvalProject | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await deepEvalProjectsService.getAllProjects();
      const list = data.projects || [];
      setProjects(list);

      // Fetch run counts for each project in parallel
      const statsArray = await Promise.all(
        (list || []).map(async (p) => {
          try {
            const res = await experimentsService.getAllExperiments({ project_id: p.id });
            const total = Array.isArray(res?.experiments) ? res.experiments.length : (res?.length ?? 0);
            return { id: p.id, total };
          } catch {
            try {
              const res = await deepEvalProjectsService.getProjectStats(p.id);
              return { id: p.id, total: res.stats.totalExperiments ?? 0 };
            } catch {
              return { id: p.id, total: 0 };
            }
          }
        })
      );
      const counts: Record<string, number> = {};
      statsArray.forEach((s) => {
        counts[s.id] = s.total;
      });
      setRunsByProject(counts);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setProjects([]);
      setRunsByProject({});
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Sorting handler
  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === columnId) {
        if (prevConfig.direction === "asc") {
          return { key: columnId, direction: "desc" };
        } else if (prevConfig.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      return { key: columnId, direction: "asc" };
    });
  }, []);

  // Sort projects (uses filtered results)
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;

    let aValue: string | number;
    let bValue: string | number;

    switch (sortConfig.key) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "useCase":
        aValue = (a.useCase || "chatbot").toLowerCase();
        bValue = (b.useCase || "chatbot").toLowerCase();
        break;
      case "runs":
        aValue = runsByProject[a.id] ?? 0;
        bValue = runsByProject[b.id] ?? 0;
        break;
      case "created":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const paginatedProjects = sortedProjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      const projectConfig = {
        name: newProject.name,
        description: newProject.description,
        useCase: newProject.useCase,
        defaultDataset: newProject.useCase,
      };

      await deepEvalProjectsService.createProject(projectConfig);

      setAlert({
        variant: "success",
        body: `Project "${newProject.name}" created successfully!`,
      });
      setTimeout(() => setAlert(null), 5000);

      setCreateModalOpen(false);
      setNewProject({ name: "", description: "", useCase: "chatbot" });

      loadProjects();
    } catch (err) {
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Failed to create project",
      });
      setTimeout(() => setAlert(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/evals/${projectId}#overview`);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    setLoading(true);
    try {
      await deepEvalProjectsService.updateProject(editingProject.id, editProjectData);
      setAlert({
        variant: "success",
        body: `Project "${editProjectData.name}" updated successfully!`,
      });
      setTimeout(() => setAlert(null), 5000);
      setEditModalOpen(false);
      setEditingProject(null);
      loadProjects();
    } catch (err) {
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Failed to update project",
      });
      setTimeout(() => setAlert(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setLoading(true);
    try {
      await deepEvalProjectsService.deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setRunsByProject((prev) => {
        const next = { ...prev };
        delete next[projectToDelete.id];
        return next;
      });
      setAlert({ variant: "success", body: "Project deleted" });
      setTimeout(() => setAlert(null), 4000);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to delete project" });
      setTimeout(() => setAlert(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: DeepEvalProject) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuProject(project);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuProject(null);
  };

  const handleMenuEdit = () => {
    if (menuProject) {
      setEditingProject(menuProject);
      setEditProjectData({
        name: menuProject.name,
        description: menuProject.description || "",
      });
      setEditModalOpen(true);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (menuProject) {
      setProjectToDelete(menuProject);
      setDeleteModalOpen(true);
    }
    handleMenuClose();
  };

  const getUseCaseLabel = (useCase: string | undefined) => {
    switch (useCase) {
      case "rag":
        return "RAG";
      case "chatbot":
        return "Chatbot";
      case "agent":
        return "Agent";
      default:
        return "Chatbot";
    }
  };

  const getRange = () => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, sortedProjects.length);
    return `${start} - ${end}`;
  };

  return (
    <>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Header + description */}
      <Stack spacing={1} mb={6}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
            Projects
          </Typography>
          {projects.length > 0 && (
            <Chip
              label={projects.length}
              size="small"
              sx={{
                backgroundColor: "#e0e0e0",
                color: "#424242",
                fontWeight: 600,
                fontSize: "11px",
                height: "20px",
                minWidth: "20px",
                borderRadius: "10px",
                "& .MuiChip-label": {
                  padding: "0 6px",
                },
              }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Projects organize your LLM evaluations. Each project groups related experiments, datasets, and configurations for a specific use case.
        </Typography>
      </Stack>

      {/* Controls row */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ marginBottom: "18px" }}
        gap={2}
      >
        <Stack direction="row" alignItems="center" gap={2}>
          <FilterBy columns={filterColumns} onFilterChange={handleFilterChange} />
          <GroupBy
            options={[
              { id: "useCase", label: "Use case" },
            ]}
            onGroupChange={() => {}}
          />
          <SearchBox
            placeholder="Search projects..."
            value={searchTerm}
            onChange={setSearchTerm}
            inputProps={{ "aria-label": "Search projects" }}
            fullWidth={false}
          />
        </Stack>
        <CustomizableButton
          onClick={() => setCreateModalOpen(true)}
          variant="contained"
          text="Create project"
          icon={<Plus size={16} />}
          isDisabled={!canCreateProject}
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
          }}
        />
      </Stack>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          message={
            projects.length === 0
              ? "No projects yet. Create your first project to start evaluating LLMs."
              : "No projects match your search or filter criteria."
          }
          showBorder
        />
      ) : (
        <TableContainer>
          <Table sx={singleTheme.tableStyles.primary.frame}>
            <TableHead
              sx={{
                backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
              }}
            >
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{
                      ...singleTheme.tableStyles.primary.header.cell,
                      minWidth: column.minWidth,
                      cursor: column.sortable ? "pointer" : "default",
                      userSelect: "none",
                      textAlign: column.align,
                      "&:hover": column.sortable ? {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      } : {},
                    }}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: column.align === "center" ? "center" : "flex-start",
                        gap: 0.5,
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
                      {column.sortable && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            color: sortConfig.key === column.id ? "primary.main" : "#9CA3AF",
                            flexShrink: 0,
                          }}
                        >
                          {sortConfig.key === column.id && sortConfig.direction === "asc" && <ChevronUp size={14} />}
                          {sortConfig.key === column.id && sortConfig.direction === "desc" && <ChevronDown size={14} />}
                          {sortConfig.key !== column.id && <ChevronsUpDown size={14} />}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProjects.map((project) => (
                <TableRow
                  key={project.id}
                  onClick={() => handleOpenProject(project.id)}
                  sx={{
                    ...singleTheme.tableStyles.primary.body.row,
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#F9FAFB",
                    },
                  }}
                >
                  {/* Name - Left aligned */}
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      fontSize: "13px",
                      color: "#111827",
                      textAlign: "left",
                    }}
                  >
                    {project.name}
                  </TableCell>
                  {/* Use Case - Center aligned */}
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    <Chip
                      size="small"
                      icon={project.useCase === "rag" ? <FileSearch size={12} /> : <MessageSquare size={12} />}
                      label={getUseCaseLabel(project.useCase)}
                      sx={{
                        backgroundColor: project.useCase === "rag" ? "#E0F2FE" : "#F0FDF4",
                        color: project.useCase === "rag" ? "#0369A1" : "#166534",
                        fontWeight: 500,
                        fontSize: "12px",
                        height: "24px",
                        borderRadius: "4px",
                        "& .MuiChip-icon": {
                          color: "inherit",
                          marginLeft: "8px",
                        },
                      }}
                    />
                  </TableCell>
                  {/* Description - Center aligned */}
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      fontSize: "13px",
                      color: "#6B7280",
                      textAlign: "center",
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.description || "-"}
                  </TableCell>
                  {/* Runs - Center aligned */}
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    <Chip
                      size="small"
                      label={runsByProject[project.id] ?? 0}
                      sx={{
                        backgroundColor: "#F3F4F6",
                        color: "#374151",
                        fontWeight: 500,
                        fontSize: "12px",
                        height: "22px",
                        minWidth: "32px",
                        borderRadius: "4px",
                      }}
                    />
                  </TableCell>
                  {/* Created - Center aligned */}
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      fontSize: "13px",
                      color: "#6B7280",
                      textAlign: "center",
                    }}
                  >
                    {formatDate(project.createdAt)}
                  </TableCell>
                  {/* Action - Center aligned */}
                  <TableCell
                    sx={{
                      ...singleTheme.tableStyles.primary.body.cell,
                      textAlign: "center",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(canEditProject || canDeleteProject) && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, project)}
                        sx={{
                          color: "#6B7280",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        <MoreVertical size={18} />
                      </IconButton>
                    )}
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
                  colSpan={3}
                >
                  Showing {getRange()} of {sortedProjects.length} project(s)
                </TableCell>
                <TablePagination
                  count={sortedProjects.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 15, 20, 25]}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={(props) => <TablePaginationActions {...props} />}
                  labelRowsPerPage="Projects per page"
                  labelDisplayedRows={({ page, count }) =>
                    `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
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
                      IconComponent: () => <ChevronsUpDown size={16} />,
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
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            minWidth: 140,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
          },
        }}
      >
        {canEditProject && (
          <MenuItem onClick={handleMenuEdit} sx={{ fontSize: "13px", py: 1 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Pencil size={16} color="#6B7280" />
            </ListItemIcon>
            <ListItemText primary="Edit" primaryTypographyProps={{ fontSize: "13px" }} />
          </MenuItem>
        )}
        {canDeleteProject && (
          <MenuItem onClick={handleMenuDelete} sx={{ fontSize: "13px", py: 1, color: "#DC2626" }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Trash2 size={16} color="#DC2626" />
            </ListItemIcon>
            <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: "13px", color: "#DC2626" }} />
          </MenuItem>
        )}
      </Menu>

      {/* Create Project Modal */}
      <StandardModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create project"
        description="Create a new project to organize your LLM evaluations"
        onSubmit={handleCreateProject}
        submitButtonText="Create project"
        isSubmitting={loading || !newProject.name}
      >
        <Stack spacing="8px">
          <Field
            label="Project name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="e.g., Coding Tasks Evaluation"
            isRequired
          />

          {/* LLM Use Case - card selection */}
          <Box>
            <Box sx={{ fontSize: "12px", color: "#374151", mb: "8px", fontWeight: 600 }}>
              LLM use case
            </Box>
            <Stack spacing="8px">
              <SelectableCard
                isSelected={newProject.useCase === "rag"}
                onClick={() => setNewProject({ ...newProject, useCase: "rag" })}
                icon={<FileSearch size={16} color={newProject.useCase === "rag" ? "#13715B" : "#9CA3AF"} />}
                title="RAG"
                description="Evaluate retrieval-augmented generation: recall, precision, relevancy and faithfulness."
              />
              <SelectableCard
                isSelected={newProject.useCase === "chatbot"}
                onClick={() => setNewProject({ ...newProject, useCase: "chatbot" })}
                icon={<MessageSquare size={16} color={newProject.useCase === "chatbot" ? "#13715B" : "#9CA3AF"} />}
                title="Chatbots"
                description="Evaluate conversational experiences for coherence, correctness and safety."
              />
            </Stack>
          </Box>
        </Stack>
      </StandardModal>

      {/* Edit Project Modal */}
      <StandardModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingProject(null);
        }}
        title="Edit project"
        description="Update the project name and description"
        onSubmit={handleUpdateProject}
        submitButtonText="Save changes"
        isSubmitting={loading || !editProjectData.name}
      >
        <Stack spacing={3}>
          <Field
            label="Project name"
            value={editProjectData.name}
            onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
            placeholder="e.g., Coding Tasks Evaluation"
            isRequired
          />

          <Field
            label="Description"
            value={editProjectData.description}
            onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
            placeholder="Brief description of this project..."
          />
        </Stack>
      </StandardModal>

      {/* Delete Project Confirmation Modal */}
      {deleteModalOpen && projectToDelete && (
        <ConfirmationModal
          isOpen={deleteModalOpen}
          title="Delete this project?"
          body={
            <Typography fontSize={13} color="#344054">
              This will remove the project and its experiments. This action cannot be undone.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Delete"
          onCancel={() => {
            setDeleteModalOpen(false);
            setProjectToDelete(null);
          }}
          onProceed={handleConfirmDelete}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}
    </>
  );
}
