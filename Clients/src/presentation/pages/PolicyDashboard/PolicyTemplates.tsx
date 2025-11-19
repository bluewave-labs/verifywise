import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import EmptyState from "../../components/EmptyState";
import policyTemplates from "../../assets/PolicyTemplates.json";
import {
  PolicyTemplate,
  PolicyTemplatesProps,
} from "../../../domain/interfaces/IPolicy";
import PolicyDetailModal from "../../components/Policies/PolicyDetailsModal";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { AlertProps } from "../../../domain/interfaces/iAlert";
import Select from "../../components/Inputs/Select";
import { SearchBox } from "../../components/Search";
import { PolicyTemplateCategory } from "../../../domain/enums/policy.enum";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../application/utils/paginationStorage";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import TagChip from "../../components/Tags/TagChip";

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const POLICY_TEMPLATES_SORTING_KEY = "verifywise_policy_templates_sorting";

const TITLE_OF_COLUMNS = [
  { col: "ID", width: 100 },
  { col: "TITLE", width: 300 },
  { col: "TAGS", width: 250 },
  { col: "DESCRIPTION", width: 500 },
];


const SelectorVertical = (props: any) => (
  <ChevronsUpDown size={16} {...props} />
);

const PolicyTemplates: React.FC<PolicyTemplatesProps> = ({
  tags,
  fetchAll,
}) => {
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicyTemplate, setSelectedPolicyTemplate] = useState<
    PolicyTemplate | undefined
  >(undefined);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount("policyTemplates", 10),
  );

  // Initialize sorting state from localStorage or default to no sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(POLICY_TEMPLATES_SORTING_KEY);
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
    localStorage.setItem(POLICY_TEMPLATES_SORTING_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  const handleClose = () => {
    setShowModal(false);
    setSelectedPolicyTemplate(undefined);
  };

  const handleSelectPolicyTemplate = (id: number) => {
    if (id) {
      const selectedPolicy = policyTemplates.find((policy) => policy.id === id);
      console.log(selectedPolicy);
      if (selectedPolicy) {
        const template: PolicyTemplate = {
          title: selectedPolicy.title,
          tags: selectedPolicy.tags,
          content: selectedPolicy.content,
        };
        setSelectedPolicyTemplate(template);
        setShowModal(true);
      }
    }
  };

  const handleSaved = (successMessage?: string) => {
    fetchAll();
    handleClose();

    // Show success alert if message is provided
    if (successMessage) {
      handleAlert({
        variant: "success",
        body: successMessage,
        setAlert,
        alertTimeout: 4000, // 4 seconds to give users time to read
      });
    }
  };

  const filterOptions = [
    { _id: "all", name: "All Policy Templates" },
    ...[...Object.values(PolicyTemplateCategory)].map((value) => ({
      _id: value,
      name: value,
    })),
  ];

  // Sorting handler
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

  // Filter + search
  const filteredPolicyTemplates = useMemo(() => {
    return policyTemplates.filter((p) => {
      const matchesCategory =
        categoryFilter === "all" ? true : p.category === categoryFilter;
      const matchesSearch = p.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, searchTerm]);

  // Sort the filtered data
  const sortedPolicyTemplates = useMemo(() => {
    if (!filteredPolicyTemplates || !sortConfig.key || !sortConfig.direction) {
      return filteredPolicyTemplates || [];
    }

    const sortableData = [...filteredPolicyTemplates];

    return sortableData.sort((a: PolicyTemplate, b: PolicyTemplate) => {
      let aValue: string | number;
      let bValue: string | number;

      const sortKey = sortConfig.key.trim().toLowerCase();

      // Handle different column types
      if (sortKey === "id") {
        aValue = a.id;
        bValue = b.id;
      } else if (sortKey === "title") {
        aValue = a.title?.toLowerCase() || "";
        bValue = b.title?.toLowerCase() || "";
      } else if (sortKey === "description") {
        aValue = a.description?.toLowerCase() || "";
        bValue = b.description?.toLowerCase() || "";
      } else {
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
  }, [filteredPolicyTemplates, sortConfig]);

  useEffect(() => setPage(0), [sortedPolicyTemplates.length, sortConfig]);

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => setPage(newPage),
    [],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount("policyTemplates", newRowsPerPage);
      setPage(0);
    },
    [],
  );

  return (
    <Stack>
      <Stack direction="row" spacing={6} alignItems="center" mb={8}>
        {/* Dropdown Filter */}
        <div data-joyride-id="policy-status-filter">
          <Select
            id="policy-category"
            value={categoryFilter}
            items={filterOptions}
            onChange={(e: SelectChangeEvent<string | number>) =>
              setCategoryFilter(`${e.target.value}`)
            }
            sx={{
              minWidth: "225px",
              height: "34px",
              bgcolor: "#fff",
            }}
          />
        </div>

        {/* Search */}
        <Box sx={{ width: 300 }} data-joyride-id="policy-search">
          <SearchBox
            placeholder="Search policy templates..."
            value={searchTerm}
            onChange={setSearchTerm}
            inputProps={{ "aria-label": "Search policy templates" }}
          />
        </Box>
      </Stack>
      <Stack spacing={6}>
        <Stack
          sx={{
            maxHeight: "75vh",
            overflow: "auto",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.spacing(1),
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {TITLE_OF_COLUMNS.map((column) => {
                    const sortable = column.col !== "TAGS"; // All columns except TAGS are sortable
                    return (
                      <TableCell
                        key={column.col}
                        sx={{
                          fontSize: 13,
                          fontWeight: 400,
                          color: sortConfig.key === column.col ? theme.palette.primary.main : theme.palette.text.secondary,
                          bgcolor: theme.palette.grey[50],
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          minWidth: column.width,
                          width: column.col === 'ID' ? column.width : 'auto',
                          cursor: sortable ? "pointer" : "default",
                          userSelect: sortable ? "none" : "auto",
                          "&:hover": sortable ? {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          } : {},
                          whiteSpace: "nowrap",
                        }}
                        onClick={() => sortable && handleSort(column.col)}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <Box component="span" sx={{ flexShrink: 0 }}>
                            {column.col}
                          </Box>
                          {sortable && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                flexShrink: 0,
                                color: sortConfig.key === column.col ? theme.palette.primary.main : "#9CA3AF",
                              }}
                            >
                              {sortConfig.key === column.col && sortConfig.direction === "asc" && (
                                <ChevronUp size={16} />
                              )}
                              {sortConfig.key === column.col && sortConfig.direction === "desc" && (
                                <ChevronDown size={16} />
                              )}
                              {sortConfig.key !== column.col && (
                                <ChevronsUpDown size={16} />
                              )}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              {sortedPolicyTemplates.length === 0 && (
                <TableBody>
                  <TableRow>
                    <TableCell
                      colSpan={TITLE_OF_COLUMNS.length}
                      align="center"
                      sx={{ border: "none", p: 0 }}
                    >
                      <EmptyState message="No policies found in database" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
              <TableBody>
                {sortedPolicyTemplates
                  ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((policy) => (
                    <TableRow
                      key={policy.id}
                      onClick={() => handleSelectPolicyTemplate(policy.id)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: "inherit",
                        "&:hover": {
                          backgroundColor: theme.palette.action.hover,
                        },
                        verticalAlign: "initial",
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select policy: ${policy.title}`}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          backgroundColor: sortConfig.key === "ID" ? "#f5f5f5" : "inherit",
                        }}
                      >
                        {policy.id}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          backgroundColor: sortConfig.key === "TITLE" ? "#f5f5f5" : "inherit",
                        }}
                      >
                        {policy.title}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          {policy.tags.map((tag, index) => (
                            <TagChip key={`${tag}-${index}`} tag={tag} />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 250,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          backgroundColor: sortConfig.key === "DESCRIPTION" ? "#f5f5f5" : "inherit",
                        }}
                      >
                        {policy.description}
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
                    }}
                    colSpan={3}
                  >
                    Showing {page * rowsPerPage + 1} -{" "}
                    {Math.min(
                      page * rowsPerPage + rowsPerPage,
                      sortedPolicyTemplates.length,
                    )}{" "}
                    of {sortedPolicyTemplates.length} items
                  </TableCell>
                  <TablePagination
                    count={sortedPolicyTemplates.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 15, 25]}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={
                      TablePaginationActions as React.ComponentType<any>
                    }
                    labelRowsPerPage="Rows per page"
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
                          anchorOrigin: {
                            vertical: "top",
                            horizontal: "left",
                          },
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
        </Stack>
      </Stack>

      {/* Modal */}
      {showModal && tags.length > 0 && (
        <PolicyDetailModal
          policy={null}
          tags={tags}
          onClose={handleClose}
          onSaved={handleSaved}
          template={selectedPolicyTemplate}
        />
      )}

      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
    </Stack>
  );
};

export default PolicyTemplates;
