import {
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
  useTheme,
  TableFooter,
  TablePagination,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import React from "react";
import StandardModal from "../Modals/StandardModal";
import Chip from "../Chip";
import singleTheme from "../../themes/v1SingleTheme";
import {
  tableWrapper,
  paginationDropdown,
  paginationSelect,
  paginationStyle,
} from "../Table/styles";
import EmptyState from "../EmptyState";
import TablePaginationActions from "../TablePagination";
import { ChevronsUpDown } from "lucide-react";
import { IModelRisk } from "../../../domain/interfaces/i.modelRisk";
import { getAllEntities } from "../../../application/repository/entity.repository";

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);

interface ModelRisksDialogProps {
  open: boolean;
  onClose: () => void;
  modelId: number;
  modelName: string;
}

const ModelRisksDialog: React.FC<ModelRisksDialogProps> = ({
  open,
  onClose,
  modelId,
  modelName,
}) => {
  const [modelRisks, setModelRisks] = useState<IModelRisk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const theme = useTheme();

  const fetchModelRisks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllEntities({ routeUrl: "/modelRisks?filter=active" });
      // Filter risks for this specific model
      const risksData = Array.isArray(response) ? response : (response.data || []);
      const risks = risksData.filter(
        (risk: IModelRisk) => risk.model_id === modelId && !risk.is_deleted
      );
      setModelRisks(risks);
    } catch (err) {
      console.error("Failed to fetch model risks:", err);
      setError("Failed to load model risks");
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => {
    if (open && modelId) {
      fetchModelRisks();
    }
  }, [open, modelId, fetchModelRisks]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <StandardModal
      isOpen={open}
      onClose={onClose}
      title={`Model risks ${modelName ? `- ${modelName}` : ""} (${modelRisks.length})`}
      description="View all risks associated with this model"
      maxWidth="900px"
      hideFooter={true}
    >
      {loading ? (
        <Stack
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
          }}
        >
          <CircularProgress size={40} />
        </Stack>
      ) : error ? (
        <MuiAlert severity="error" sx={{ mt: 2 }}>
          {error}
        </MuiAlert>
      ) : (
        <TableContainer>
          <Table
            sx={{
              ...singleTheme.tableStyles.primary.frame,
              ...tableWrapper(theme),
            }}
          >
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
                  Risk name
                </TableCell>
                <TableCell
                  style={{
                    ...singleTheme.tableStyles.primary.header.cell,
                  }}
                >
                  Category
                </TableCell>
                <TableCell
                  style={{
                    ...singleTheme.tableStyles.primary.header.cell,
                  }}
                >
                  Risk level
                </TableCell>
                <TableCell
                  style={{
                    ...singleTheme.tableStyles.primary.header.cell,
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  style={{
                    ...singleTheme.tableStyles.primary.header.cell,
                  }}
                >
                  Owner
                </TableCell>
              </TableRow>
            </TableHead>
            {modelRisks.length > 0 ? (
              <>
                <TableBody>
                  {modelRisks
                    .slice(
                      page * rowsPerPage,
                      page * rowsPerPage + rowsPerPage
                    )
                    .map((risk) => (
                      <TableRow
                        key={risk.id}
                        sx={{
                          ...singleTheme.tableStyles.primary.body.row,
                        }}
                      >
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            maxWidth: 200,
                          }}
                        >
                          <Typography
                            variant="body2"
                            noWrap
                            title={risk.risk_name}
                          >
                            {risk.risk_name && risk.risk_name.length > 30
                              ? `${risk.risk_name.slice(0, 30)}...`
                              : risk.risk_name || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            maxWidth: 120,
                          }}
                        >
                          <Typography variant="body2">
                            {risk.risk_category || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={singleTheme.tableStyles.primary.body.cell}
                        >
                          <Chip label={risk.risk_level} />
                        </TableCell>
                        <TableCell
                          sx={singleTheme.tableStyles.primary.body.cell}
                        >
                          <Chip label={risk.status} />
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            maxWidth: 120,
                          }}
                        >
                          <Typography variant="body2" noWrap title={risk.owner}>
                            {risk.owner && risk.owner.length > 15
                              ? `${risk.owner.slice(0, 15)}...`
                              : risk.owner || "-"}
                          </Typography>
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
                    <TablePagination
                      count={modelRisks.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      rowsPerPageOptions={[5, 10, 15, 20, 25]}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      ActionsComponent={(props) => (
                        <TablePaginationActions {...props} />
                      )}
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
                    colSpan={5}
                    sx={{ border: "none", p: 0 }}
                  >
                    <EmptyState message="No risks found for this model." />
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </TableContainer>
      )}
    </StandardModal>
  );
};

export default ModelRisksDialog;
