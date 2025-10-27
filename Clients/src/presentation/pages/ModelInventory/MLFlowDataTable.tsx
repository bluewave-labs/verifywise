import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  Grid,
  CardContent,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  Chip,
  useTheme,
} from "@mui/material";
import { RefreshCw, XCircle, Eye, ChevronsUpDown } from "lucide-react";
import { apiServices } from "../../../infrastructure/api/networkServices";
import HeaderCard from "../../components/Cards/DashboardHeaderCard";
import RiskChip from "../../components/RiskLevel/RiskChip";
import { getSeverityColorByText } from "../../components/RiskLevel/constants";
import EmptyState from "../../components/EmptyState";
import { vwhomeHeaderCards } from "../../pages/Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";
import TablePaginationActions from "../../components/TablePagination";
import {
  tableFooterRowStyle,
  showingTextCellStyle,
  paginationMenuProps,
  paginationSelectStyle,
  paginationStyle,
} from "../ModelInventory/style";

const SelectorVertical = (props: any) => <ChevronsUpDown size={16} {...props} />;

interface MLFlowModel {
  id: string;
  name: string;
  version: string;
  lifecycle_stage: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
  description?: string;
  run_id?: string;
  source?: string;
  status?: string;
  tags?: Record<string, string>;
  metrics?: Record<string, number>;
  parameters?: Record<string, string>;
  experiment_info?: {
    experiment_id: string;
    experiment_name: string;
    artifact_location: string;
  };
}

const MLFlowDataTable: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<MLFlowModel | null>(null);
  const [mlflowData, setMlflowData] = useState<MLFlowModel[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const summaryStats = useMemo(() => {
    const stageCounts = mlflowData.reduce(
      (acc, model) => {
        const stage = (model.lifecycle_stage || "").toLowerCase();
        if (stage === "production") acc.active += 1;
        else if (stage === "staging") acc.staging += 1;
        else if (stage === "archived") acc.archived += 1;
        return acc;
      },
      { active: 0, staging: 0, archived: 0 },
    );

    const experiments = new Set(
      mlflowData
        .map((model) => model.experiment_info?.experiment_id)
        .filter(Boolean),
    ).size;

    return {
      total: mlflowData.length,
      active: stageCounts.active,
      staging: stageCounts.staging,
      archived: stageCounts.archived,
      experiments,
    };
  }, [mlflowData]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const fetchMLFlowData = async () => {
    setLoading(true);
    setWarning(null);

    try {
      const response = await apiServices.get<any[]>("/integrations/mlflow/models");

      if (response.data && Array.isArray(response.data)) {
        setMlflowData(response.data);
      } else {
        throw new Error("Invalid data format from API");
      }
    } catch (err: any) {
      console.error("Error fetching MLFlow data:", err);
      if (err?.status === 400) {
        setWarning("Configure the MLFlow integration to start syncing live data.");
      } else {
        setWarning("Unable to reach the MLFlow backend.");
      }
      setMlflowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLFlowData();
  }, []);

  const handleRefresh = () => {
    fetchMLFlowData();
  };

  const handleModelClick = (model: MLFlowModel) => {
    setSelectedModel(model);
  };

  const handleCloseModal = () => {
    setSelectedModel(null);
  };

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return mlflowData.slice(start, end);
  }, [mlflowData, page, rowsPerPage]);

  const getRange = useMemo(() => {
    if (!mlflowData.length) {
      return "0 - 0";
    }
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, mlflowData.length);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, mlflowData.length]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
        <Typography variant="body2">Loading MLFlow data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "100%", overflowX: "hidden" }}>
      {/* Header Section */}
      {warning && (
        <Alert severity="warning" sx={{ mb: 8 }}>
          {warning}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end", alignItems: "center", width: "100%" }}>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Header Cards - using vwhomeHeaderCards for horizontal layout */}
      <Box sx={vwhomeHeaderCards} data-joyride-id="mlflow-summary-cards">
        <HeaderCard
          title="Models"
          count={summaryStats.total}
          disableNavigation
        />
        <HeaderCard
          title="Active"
          count={summaryStats.active}
        />
        <HeaderCard
          title="Staging"
          count={summaryStats.staging}
        />
        <HeaderCard
          title="Experiments"
          count={summaryStats.experiments}
        />
      </Box>

      {/* Table Section - increased spacing */}
      <Box sx={{ mt: 8, mb: 2 }}>
        {mlflowData.length === 0 && !loading ? (
          <EmptyState message="No MLFlow runs have been synced yet. Configure the integration and click Refresh to pull the latest models." />
        ) : (
          <TableContainer sx={singleTheme.tableStyles.primary.frame}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead
                sx={{
                  backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
                }}
              >
                <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                  {["Model Name", "Version", "Status", "Created", "Last Updated", "Description", "Actions"].map((header) => (
                    <TableCell
                      key={header}
                      sx={singleTheme.tableStyles.primary.header.cell}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((model) => (
                  <TableRow
                    key={model.id}
                    sx={singleTheme.tableStyles.primary.body.row}
                    onClick={() => handleModelClick(model)}
                  >
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {model.name}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {model.version}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <RiskChip label={model.lifecycle_stage} backgroundColor={getSeverityColorByText(model.lifecycle_stage)} />
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {formatDate(model.creation_timestamp)}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {formatDate(model.last_updated_timestamp)}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {model.description || "No description"}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Tooltip title="View details">
                          <IconButton size="small" sx={{ mr: 1 }}>
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {mlflowData.length > 0 && (
                <TableFooter>
                  <TableRow sx={tableFooterRowStyle(theme)}>
                    <TableCell sx={showingTextCellStyle(theme)}>
                      Showing {getRange} of {mlflowData.length} model(s)
                    </TableCell>
                    <TablePagination
                      count={mlflowData.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      rowsPerPageOptions={[5, 10, 15, 25]}
                      onRowsPerPageChange={handleRowsPerPageChange}
                      ActionsComponent={(props) => <TablePaginationActions {...props} />}
                      labelRowsPerPage="Rows per page"
                      labelDisplayedRows={({ page, count }) => `Page ${page + 1} of ${Math.max(1, Math.ceil(count / rowsPerPage))}`}
                      slotProps={{
                        select: {
                          MenuProps: paginationMenuProps(theme),
                          inputProps: { id: "mlflow-pagination-dropdown" },
                          IconComponent: SelectorVertical,
                          sx: paginationSelectStyle(theme),
                        },
                      }}
                      sx={paginationStyle(theme)}
                    />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        )}
      </Box>

      {selectedModel && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Card sx={{ maxWidth: 600, width: "90%", maxHeight: "80vh", overflow: "auto" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "15px" }}>
                  {selectedModel.name}
                </Typography>
                <IconButton onClick={handleCloseModal}>
                  <XCircle size={20} />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Version:</strong> {selectedModel.version}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {selectedModel.status || selectedModel.lifecycle_stage}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Run ID:</strong> {selectedModel.run_id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Created:</strong> {formatDate(selectedModel.creation_timestamp)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedModel.description || "No description available"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {Object.entries(selectedModel.tags || {}).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        size="small"
                        sx={{
                          backgroundColor: "#E0EAFF",
                          color: "#0F172A",
                          borderRadius: "4px",
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Metrics
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {Object.entries(selectedModel.metrics || {}).map(([key, value]) => (
                      <Typography variant="body2" key={key}>
                        <strong>{key}:</strong> {typeof value === "number" ? value.toFixed(4) : value}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Parameters
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {Object.entries(selectedModel.parameters || {}).map(([key, value]) => (
                      <Typography variant="body2" key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Experiment Information
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Experiment ID:</strong> {selectedModel.experiment_info?.experiment_id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Experiment Name:</strong> {selectedModel.experiment_info?.experiment_name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Artifact Location:</strong> {selectedModel.experiment_info?.artifact_location}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default MLFlowDataTable;
