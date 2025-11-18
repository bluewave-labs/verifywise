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
import { ChevronsUpDown } from "lucide-react";

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
    getPaginationRowCount("policyManager", 5),
  );

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

  useEffect(() => setPage(0), [filteredPolicyTemplates.length]);

  const handleChangePage = useCallback(
    (_: unknown, newPage: number) => setPage(newPage),
    [],
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount("policyManager", newRowsPerPage);
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
                  {TITLE_OF_COLUMNS.map((column) => (
                    <TableCell
                      key={column.col}
                      sx={{
                        fontSize: 13,
                        fontWeight: 400,
                        color: theme.palette.text.secondary,
                        bgcolor: theme.palette.grey[50],
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        minWidth: column.width,
                        width: column.col === 'ID' ? column.width : 'auto',
                      }}
                    >
                      {column.col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              {filteredPolicyTemplates.length === 0 && (
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
                {filteredPolicyTemplates
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
                      <TableCell sx={{ fontWeight: 500 }}>
                        {policy.id}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {policy.title}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" gap={2}>
                          {policy.tags.map((tag) => (
                            <Typography
                              variant="body2"
                              sx={{
                                borderRadius: 1,
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.info.contrastText,
                                fontSize: 11,
                                fontWeight: 600,
                                textAlign: "center",
                                width: "fit-content",
                                padding: "2px 8px",
                              }}
                            >
                              {tag}
                            </Typography>
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 250,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
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
                      filteredPolicyTemplates.length,
                    )}{" "}
                    of {filteredPolicyTemplates.length} items
                  </TableCell>
                  <TablePagination
                    count={filteredPolicyTemplates.length}
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
