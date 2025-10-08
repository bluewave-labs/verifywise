import {
  Dialog,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  CircularProgress,
  Alert as MuiAlert,
  Chip,
  useTheme,
  TableFooter,
  TablePagination,
} from "@mui/material";
import { useState, useEffect } from "react";
import React from "react";
import { ClearIcon } from "@mui/x-date-pickers/icons";
import { getSeverityColorByText, getRiskChipStyle } from "../RiskLevel/constants";
import { getVendorRisksByVendorId } from "../../../application/repository/vendorRisk.repository";
import AddNewRisk from "../Modals/NewRisk";
import { useVendors } from "../../../application/hooks/useVendors";
import singleTheme from "../../themes/v1SingleTheme";
import {
  emptyData,
  styles,
  tableWrapper,
  paginationDropdown,
  paginationSelect,
  paginationStyle,
} from "../Table/styles";
import placeholderImage from '../../assets/imgs/empty-state.svg';
import TablePaginationActions from "../TablePagination";
import { ChevronsUpDown as SelectorVertical } from "lucide-react";

interface VendorRisk {
  id: number;
  risk_description: string;
  impact_description: string;
  risk_severity: string;
  likelihood: string;
  risk_level: string;
  action_owner: number;
  action_plan: string;
  vendor_id: number;
}

interface VendorRisksDialogProps {
  open: boolean;
  onClose: () => void;
  vendorId: number;
  vendorName?: string;
}

const VendorRisksDialog: React.FC<VendorRisksDialogProps> = ({
  open,
  onClose,
  vendorId,
  vendorName,
}) => {
  const [vendorRisks, setVendorRisks] = useState<VendorRisk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState("2");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Get vendors data for the modal
  const { data: vendors = [] } = useVendors({ projectId: "all" });
  const theme = useTheme();

  useEffect(() => {
    if (open && vendorId) {
      fetchVendorRisks();
    }
  }, [open, vendorId]);

  const fetchVendorRisks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getVendorRisksByVendorId({ vendorId });
      setVendorRisks(response.data || []);
    } catch (err) {
      console.error('Failed to fetch vendor risks:', err);
      setError('Failed to load vendor risks');
    } finally {
      setLoading(false);
    }
  };

  const handleRiskClick = async (riskId: number) => {
    try {
      setSelectedRisk(vendorRisks.find(risk => risk.id === riskId) || null);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch risk details:', err);
      setError('Failed to load risk details');
    }
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedRisk(null);
    // Refresh the risks table after modal closes
    if (open && vendorId) {
      fetchVendorRisks();
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: "800px",
            maxWidth: "800px",
            maxHeight: "500px",
          },
        }}
      >
        <Stack sx={{
          width: "100%",
          backgroundColor: "#FCFCFD",
          padding: 10,
          borderRadius: "4px",
          height: "100%",
          overflow: "hidden"
        }}>
          <Stack sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: '100%',
            marginBottom: "20px"
          }}>
            <Typography sx={{
              fontSize: 16,
              color: "#344054",
              fontWeight: "bold",
            }}>
              Vendor Risks {vendorName ? `- ${vendorName}` : ""} ({vendorRisks.length})
            </Typography>
            <ClearIcon sx={{
              color: "#98A2B3",
              cursor: "pointer"
            }}
              onClick={onClose}
            />
          </Stack>
          {loading ? (
            <Stack sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
              <CircularProgress size={40} />
            </Stack>
          ) : error ? (
            <MuiAlert severity="error" sx={{ mt: 2 }}>
              {error}
            </MuiAlert>
          ) : (
            <TableContainer>
              <Table sx={{
                ...singleTheme.tableStyles.primary.frame,
                ...tableWrapper(theme),
              }}>
                <TableHead
                  sx={{
                    backgroundColor:
                      singleTheme.tableStyles.primary.header.backgroundColors,
                  }}
                >
                  <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                    <TableCell
                      style={{
                        ...singleTheme.tableStyles.primary.header.cell,
                      }}
                    >
                      Risk Description
                    </TableCell>
                    <TableCell
                      style={{
                        ...singleTheme.tableStyles.primary.header.cell,
                      }}
                    >
                      Severity
                    </TableCell>
                    <TableCell
                      style={{
                        ...singleTheme.tableStyles.primary.header.cell,
                      }}
                    >
                      Likelihood
                    </TableCell>
                    <TableCell
                      style={{
                        ...singleTheme.tableStyles.primary.header.cell,
                      }}
                    >
                      Risk Level
                    </TableCell>
                  </TableRow>
                </TableHead>
                {vendorRisks.length > 0 ? (
                  <>
                    <TableBody>
                      {vendorRisks
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((risk) => {
                          const normalizedRiskLevel = risk.risk_level?.toLowerCase().trim() ?? '';
                          const riskLevelColor = getSeverityColorByText(normalizedRiskLevel);

                          return (
                            <TableRow
                              key={risk.id}
                              sx={{
                                ...singleTheme.tableStyles.primary.body.row,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                },
                              }}
                              onClick={() => handleRiskClick(risk.id)}
                            >
                              <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, maxWidth: 250 }}>
                                <Typography variant="body2" noWrap title={risk.risk_description}>
                                  {risk.risk_description && risk.risk_description.length > 40
                                    ? `${risk.risk_description.slice(0, 40)}...`
                                    : risk.risk_description || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, maxWidth: 120 }}>
                                <Typography variant="body2" noWrap title={risk.risk_severity}>
                                  {risk.risk_severity && risk.risk_severity.length > 15
                                    ? `${risk.risk_severity.slice(0, 15)}...`
                                    : risk.risk_severity || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, maxWidth: 120 }}>
                                <Typography variant="body2" noWrap title={risk.likelihood}>
                                  {risk.likelihood && risk.likelihood.length > 15
                                    ? `${risk.likelihood.slice(0, 15)}...`
                                    : risk.likelihood || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                                <Chip
                                  label={risk.risk_level}
                                  size="small"
                                  sx={{
                                    ...getRiskChipStyle(),
                                    backgroundColor: riskLevelColor,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
                        <TablePagination
                          count={vendorRisks.length}
                          page={page}
                          onPageChange={handleChangePage}
                          rowsPerPage={rowsPerPage}
                          rowsPerPageOptions={[5, 10, 15, 20, 25]}
                          onRowsPerPageChange={handleChangeRowsPerPage}
                          ActionsComponent={(props) => <TablePaginationActions {...props} />}
                          labelRowsPerPage="Risks per page"
                          labelDisplayedRows={({ page, count }) =>
                            `Page ${page + 1} of ${Math.max(
                              0,
                              Math.ceil(count / rowsPerPage)
                            )}`
                          }
                          sx={paginationStyle(theme)}
                          slotProps={{
                            select: {
                              MenuProps: {
                                keepMounted: true,
                                PaperProps: {
                                  className: "pagination-dropdown",
                                  sx: paginationDropdown(theme),
                                },
                                transformOrigin: { vertical: "bottom", horizontal: "left" },
                                anchorOrigin: { vertical: "top", horizontal: "left" },
                                sx: { mt: theme.spacing(-2) },
                              },
                              inputProps: { id: "pagination-dropdown" },
                              IconComponent: () => <SelectorVertical size={16} />,
                              sx: paginationSelect(theme),
                            },
                          }}
                        />
                      </TableRow>
                    </TableFooter>
                  </>
                ) : (
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={emptyData(theme)}
                      >
                        <img src={placeholderImage} alt="Placeholder" />
                        <Typography sx={styles.textBase}>
                          No risks found for this vendor.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Dialog>

      {/* Edit Risk Modal */}
      {isEditModalOpen && selectedRisk && (
        <AddNewRisk
          isOpen={isEditModalOpen}
          setIsOpen={handleModalClose}
          value={tabValue}
          handleChange={handleTabChange}
          existingRisk={selectedRisk}
          onSuccess={() => {
            handleModalClose();
          }}
          vendors={vendors}
        />
      )}
    </>
  );
};

export default VendorRisksDialog;