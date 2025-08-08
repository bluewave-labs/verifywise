import React, { useState, useCallback, useMemo } from "react";
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
  TableFooter,
} from "@mui/material";
import TablePaginationActions from "../../components/TablePagination";
import "../../components/Table/index.css";
import singleTheme from "../../themes/v1SingleTheme";
import CustomIconButton from "../../components/IconButton";
import allowedRoles from "../../../application/constants/permissions";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import { useContext } from "react";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import Placeholder from "../../assets/imgs/empty-state.svg";
import dayjs from "dayjs";

// Updated columns: add ID as first column, split badges
const TABLE_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "model", label: "PROVIDER/MODEL" },
  { id: "version", label: "VERSION" },
  { id: "approver", label: "APPROVER" },
  { id: "capabilities", label: "CAPABILITIES" },
  { id: "security_assessment", label: "SECURITY ASSESSMENT" },
  { id: "status", label: "STATUS" },
  { id: "status_date", label: "STATUS DATE" },
  { id: "actions", label: "ACTION" },
];

export interface IModelInventory {
  id: string | number;
  model: string;
  version: string;
  approver: string;
  capabilities: string;
  security_assessment: "Yes" | "No";
  status: "Approved" | "Pending" | "Restricted" | "Blocked";
  status_date: number;
}

interface ModelInventoryTableProps {
  data: IModelInventory[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  paginated?: boolean;
}

const DEFAULT_ROWS_PER_PAGE = 5;

// Security Assessment Badge
const SecurityAssessmentBadge: React.FC<{ value: "Yes" | "No" }> = ({ value }) => (
  <span
    style={{
      backgroundColor: value === "Yes" ? "#28A745" : "#BF1E2D",
      color: "#fff",
      padding: "4px 16px",
      borderRadius: 8,
      fontWeight: 600,
      fontSize: "0.85rem",
      textTransform: "capitalize",
      display: "inline-block",
      minWidth: 48,
      textAlign: "center",
    }}
  >
    {value}
  </span>
);

// Status Badge
const StatusBadge: React.FC<{ value: IModelInventory["status"] }> = ({ value }) => {
  const colorMap = {
    Approved: { bg: "#28A745", color: "#fff" },
    Pending: { bg: "#FFC107", color: "#fff" },
    Restricted: { bg: "#FD7E14", color: "#fff" },
    Blocked: { bg: "#DC3545", color: "#fff" },
  } as const;
  const style = colorMap[value] || { bg: "#e0e0e0", color: "#424242" };
  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "4px 8px",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        display: "inline-block",
        minWidth: 80,
        textAlign: "center",
      }}
    >
      {value}
    </span>
  );
};

const InventoryTable: React.FC<ModelInventoryTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  paginated = true,
}) => {
  const theme = useTheme();
  const { userRoleName } = useContext(VerifyWiseContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const isDeletingAllowed =
    allowedRoles.training?.delete?.includes(userRoleName);

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
    const end = Math.min(page * rowsPerPage + rowsPerPage, data?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, data?.length]);

  const tableHeader = useMemo(
    () => (
      <TableHead
        sx={{
          backgroundColor:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow sx={singleTheme.tableStyles.primary.header.row}>
          {TABLE_COLUMNS.map((column) => (
            <TableCell
              key={column.id}
              sx={{
                ...singleTheme.tableStyles.primary.header.cell,
                fontWeight: 600,
                fontSize: "13px",
                color: "#98A2B3",
                background: "#F9FAFB",
                borderBottom: "1px solid #EAECF0",
                ...(column.id === "actions" && {
                  position: "sticky",
                  right: 0,
                  zIndex: 10,
                  background: "#F9FAFB",
                }),
              }}
            >
              {column.label}
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
        {data?.length > 0 ? (
          data
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
                  fontSize: "14px",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(row.id?.toString?.());
                }}
              >
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {row.id}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {row.model}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {row.version}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {row.approver}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {row.capabilities}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <SecurityAssessmentBadge value={row.security_assessment} />
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <StatusBadge value={row.status} />
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {dayjs(row.status_date).format("DD MMMM YYYY")}
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
                  {isDeletingAllowed && (
                    <CustomIconButton
                      id={typeof row.id === "number" ? row.id : Number(row.id)}
                      onDelete={() => onDelete?.(row.id.toString())}
                      onEdit={() => {
                        onEdit?.(row.id.toString());
                      }}
                      onMouseEvent={() => {}}
                      warningTitle="Delete this Model?"
                      warningMessage="When you delete this model, all data related to this training will be removed. This action is non-recoverable."
                      type="Training"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={TABLE_COLUMNS.length}
              align="center"
              sx={{ py: 4 }}
            >
              No model inventory data available.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    ),
    [data, page, rowsPerPage, isDeletingAllowed, onEdit, onDelete]
  );

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          padding: theme.spacing(15, 5),
          minHeight: 200,
        }}
      >
        <Typography>Loading...</Typography>
      </Stack>
    );
  }

  if (!data || data.length === 0) {
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
        <img src={Placeholder} alt="Placeholder" />
        <Typography sx={{ fontSize: "13px", color: "#475467" }}>
          There is currently no data in this table.
        </Typography>
      </Stack>
    );
  }

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table sx={singleTheme.tableStyles.primary.frame}>
        {tableHeader}
        {tableBody}
        {paginated && (
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
                Showing {getRange} of {data?.length} model(s)
              </TableCell>
              <TablePagination
                count={data?.length ?? 0}
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
        )}
      </Table>
    </TableContainer>
  );
};

// Demo data for the Model Inventory Table
const demoData = [
  { id: "1", model: "Mistral Large", version: "2024.2", approver: "John McAllen", capabilities: ["Code", "Multimodal"], security_assessment: true, status: "Approved", status_date: "2024-01-12" },
  { id: "2", model: "Anthropic Claude", version: "2.1", approver: "Jessica Parker", capabilities: ["Tools", "RAG", "Multimodal"], security_assessment: true, status: "Pending", status_date: "2024-01-12" },
  { id: "3", model: "Google Gemini", version: "1.5-pro", approver: "Emily Chen", capabilities: ["Vision", "Audio", "Video"], security_assessment: false, status: "Restricted", status_date: "2024-02-28" },
  { id: "4", model: "OpenAI GPT-4o", version: "2024.05", approver: "David Lee", capabilities: ["Code", "Vision", "Multimodal"], security_assessment: true, status: "Approved", status_date: "2024-05-01" },
  { id: "5", model: "Amazon Titan", version: "v1.0", approver: "Sarah Jones", capabilities: ["Text", "Generation"], security_assessment: false, status: "Blocked", status_date: "2024-03-10" },
  { id: "6", model: "Cohere Command", version: "R-24", approver: "Mike Brown", capabilities: ["Text", "Code"], security_assessment: true, status: "Approved", status_date: "2024-03-15" },
  { id: "7", model: "Meta Llama 3", version: "70B", approver: "Jane Foster", capabilities: ["Multimodal", "Code"], security_assessment: true, status: "Pending", status_date: "2024-04-20" },
  { id: "8", model: "HuggingFace BLOOM", version: "1.0", approver: "Tom Evans", capabilities: ["Text", "Generation"], security_assessment: false, status: "Restricted", status_date: "2024-01-05" },
  { id: "9", model: "Tii Falcon", version: "40B", approver: "Laura White", capabilities: ["Text", "Code"], security_assessment: true, status: "Approved", status_date: "2024-04-22" },
];

// If you want to always show the demo data, use this:
//const [data, setData] = useState(demoData);

// Or, if you want to use demo data only if no real data is loaded:
const tableData = demoData && data.length > 0 ? data : demoData;

// Then in your table rendering:
<InventoryTable
  data={tableData}
  isLoading={isLoading}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

export default InventoryTable;
