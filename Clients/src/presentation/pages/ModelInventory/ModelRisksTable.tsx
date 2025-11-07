import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
  Stack,
  Typography,
  Box,
  TableFooter,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import SkeletonCard from "../../components/SkeletonCard";
import singleTheme from "../../themes/v1SingleTheme";
import IconButton from "../../components/IconButton";
import TablePaginationActions from "../../components/TablePagination";
import { ChevronsUpDown } from "lucide-react";

const SelectorVertical = (props: any) => <ChevronsUpDown size={16} {...props} />;
import RiskChip from "../../components/RiskLevel/RiskChip";
import { IModelRisk } from "../../../domain/interfaces/i.modelRisk";
import { User } from "../../../domain/types/User";
import { IModelInventory } from "../../../domain/interfaces/i.modelInventory";

const titleOfTableColumns = [
  "risk name",
  "model name",
  "category",
  "risk level",
  "status",
  "owner",
  "target date",
  " ",
];

interface ModelRisksTableProps {
  data: IModelRisk[];
  isLoading: boolean;
  onEdit: (riskId: number) => void;
  onDelete: (riskId: number) => void;
  deletingId?: number | null;
  users?: User[];
  models?: IModelInventory[];
}

const ModelRisksTable: React.FC<ModelRisksTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  deletingId,
  users = [],
  models = [],
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  
  const getCellStyle = (row: IModelRisk) => ({
    ...cellStyle,
    ...(row.is_deleted && {
      textDecoration: 'line-through',
    })
  });

  const formattedUsers = useMemo(() => {
    return users.map((user: User) => ({
      _id: user.id,
      name: `${user.name} ${user.surname}`,
    }));
  }, [users]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(
      page * rowsPerPage + rowsPerPage,
      data?.length ?? 0
    );
    return `${start} - ${end}`;
  }, [page, rowsPerPage, data?.length ?? 0]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getOwnerName = (ownerId: string | number) => {
    const owner = formattedUsers.find((user) => user._id == ownerId);
    return owner?.name || "Unknown";
  };

  const getModelName = (modelId: number | null | undefined) => {
    if (!modelId) return "N/A";
    const model = models.find((m) => m.id == modelId);
    return model?.model || "Unknown";
  };

  const tableHeader = useMemo(
    () => (
      <TableHead
        sx={{
          backgroundColor:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow sx={singleTheme.tableStyles.primary.header.row}>
          {titleOfTableColumns.map((cell, index) => (
            <TableCell
              key={index}
              style={{
                ...singleTheme.tableStyles.primary.header.cell,
                ...(index === titleOfTableColumns.length - 1
                  ? {
                      position: "sticky",
                      right: 0,
                      zIndex: 10,
                      backgroundColor:
                        singleTheme.tableStyles.primary.header.backgroundColors,
                    }
                  : {}),
              }}
            >
              {cell}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    ),
    []
  );

  const tableBody = useMemo(
    () => (
      <TableBody>
        {data &&
          data
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row: IModelRisk) => (
              <TableRow
                key={row.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  ...(row.is_deleted && {
                    opacity: 0.7,
                    backgroundColor: theme.palette.action?.hover || '#fafafa',
                  })
                }}
                onClick={() => onEdit(row.id!)}
              >
                <TableCell sx={getCellStyle(row)}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                    {row.risk_name}
                  </Typography>
                </TableCell>
                <TableCell sx={getCellStyle(row)}>
                  {getModelName(row.model_id)}
                </TableCell>
                <TableCell sx={getCellStyle(row)}>
                  {row.risk_category}
                </TableCell>
                <TableCell sx={getCellStyle(row)}>
                  <RiskChip label={row.risk_level} />
                </TableCell>
                <TableCell sx={getCellStyle(row)}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor:
                          row.status === "Open" ? "#f04438" :
                          row.status === "In Progress" ? "#f79009" :
                          row.status === "Resolved" ? "#12b76a" :
                          "#6b7280", // Accepted
                      }}
                    />
                    <Typography sx={{ fontSize: 13 }}>
                      {row.status}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={getCellStyle(row)}>
                  {getOwnerName(row.owner)}
                </TableCell>
                <TableCell sx={getCellStyle(row)}>
                  {formatDate(row.target_date)}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    position: "sticky",
                    right: 0,
                    zIndex: 10,
                    minWidth: "50px",
                  }}
                >
                  <IconButton
                    id={row.id!}
                    onDelete={() => onDelete(row.id!)}
                    onEdit={() => onEdit(row.id!)}
                    onMouseEvent={() => {}}
                    warningTitle="Delete this model risk?"
                    warningMessage="This action is non-recoverable."
                    type="model risk"
                  />
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    ),
    [
      data,
      page,
      rowsPerPage,
      cellStyle,
      formattedUsers,
      models,
      onEdit,
      onDelete,
      deletingId,
    ]
  );

  // Show loading state
  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          padding: theme.spacing(15, 5),
          paddingBottom: theme.spacing(20),
          gap: theme.spacing(10),
          minHeight: 200,
        }}
      >
        <Typography sx={{ fontSize: "13px", color: "#475467" }}>
          Loading model risks...
        </Typography>
      </Stack>
    );
  }

  return (
    <>
      {/* Empty state outside the table */}
      {!data || data.length === 0 ? (
        <Stack alignItems="center" sx={{ pt: '75px', pb: 16 }}>
          <Box sx={{ mb: '20px' }}>
            <SkeletonCard showHalo={false} />
          </Box>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF", fontWeight: 400 }}>
            There are currently no model risks in this table.
          </Typography>
        </Stack>
      ) : (
        <TableContainer>
          <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
            {tableHeader}
            {tableBody}
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
                >
                  Showing {getRange} of {data?.length} model risk(s)
                </TableCell>
                <TablePagination
                  count={data?.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 15, 25]}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
                  labelRowsPerPage="Rows per page"
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
      )}
    </>
  );
};

export default ModelRisksTable;