import { TableBody, TableRow, TableCell, Chip, Box } from "@mui/material";
import { Trash2 as TrashIcon } from "lucide-react";
import singleTheme from "../../../../themes/v1SingleTheme";
import ConfirmableDeleteIconButton from "../../../../components/Modals/ConfirmableDeleteIconButton";
import { IEvaluationTableBodyProps } from "../../../../../domain/interfaces/i.table";

const StatusChip: React.FC<{
  status: "In Progress" | "Completed" | "Failed" | "Pending" | "Running";
}> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "In Progress":
      case "Running":
        return {
          backgroundColor: "#fff3e0",
          color: "#ef6c00",
        };
      case "Completed":
        return {
          backgroundColor: "#c8e6c9",
          color: "#388e3c",
        };
      case "Failed":
        return {
          backgroundColor: "#ffebee",
          color: "#c62828",
        };
      case "Pending":
        return {
          backgroundColor: "#e0e0e0",
          color: "#616161",
        };
      default:
        return {
          backgroundColor: "#e0e0e0",
          color: "#616161",
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        ...styles,
        fontWeight: 500,
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderRadius: "4px",
        "& .MuiChip-label": {
          padding: "4px 8px",
        },
      }}
    />
  );
};

const EvaluationTableBody: React.FC<IEvaluationTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onShowDetails,
  onRemoveModel,
}) => {
  return (
    <TableBody>
      {rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((row) => (
          <TableRow
            key={row.id}
            onClick={() => onShowDetails(row)}
            sx={{
              ...singleTheme.tableStyles.primary.body.row,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#F9FAFB",
              },
            }}
          >
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                width: "20%",
              }}
            >
              {row.status === "Running" || row.status === "In Progress"
                ? "Pending..."
                : row.name || row.id}
            </TableCell>
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
              }}
            >
              {row.model}
            </TableCell>
            {row.judge !== undefined && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                }}
              >
                {row.judge || "-"}
              </TableCell>
            )}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
              }}
            >
              {row.dataset}
            </TableCell>
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
              }}
            >
              <StatusChip status={row.status} />
            </TableCell>
            {onRemoveModel && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <ConfirmableDeleteIconButton
                    disabled={false}
                    id={row.id}
                    onConfirm={(id) => onRemoveModel.onConfirm(String(id))}
                    title="Delete this evaluation?"
                    message={`Are you sure you want to delete evaluation "${row.name || row.id}"?`}
                    customIcon={<TrashIcon size={18} color="#667085" />}
                  />
                </Box>
              </TableCell>
            )}
          </TableRow>
        ))}
    </TableBody>
  );
};

export default EvaluationTableBody;
