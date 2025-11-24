import { TableBody, TableRow, TableCell, Box, Chip } from "@mui/material";
import singleTheme from "../../../../themes/v1SingleTheme";
import { Trash2 as TrashIcon } from "lucide-react";
import Button from "../../../../components/Button/index";
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
          <TableRow key={row.id} sx={{
            ...singleTheme.tableStyles.primary.body.row,
            "&:hover": {
              cursor: "default",
            },
          }}>
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
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
              }}
            >
              <Box display="flex" justifyContent="left">
                <Button
                  onClick={() => onShowDetails(row)}
                  sx={{
                    ml: -2,
                    fontSize: "18 !important",
                    backgroundColor: "#13715B", // keep your styling
                    color: "white",
                    textTransform: "none",
                    opacity: row.status !== "Completed" ? 0.5 : 1,
                    pointerEvents: row.status !== "Completed" ? "none" : "auto",
                    "&:hover": {
                      backgroundColor: "#13715B",
                    },
                  }}
                >
                  Show
                </Button>
              </Box>
            </TableCell>
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
              }}
            >
              <ConfirmableDeleteIconButton
                disabled={false}
                id={row.id}
                onConfirm={(id) => onRemoveModel.onConfirm(String(id))}
                title={`Delete this evaluation?`}
                message={`Are you sure you want to delete evaluation ID ${row.id} (Status: ${row.status})? This action is non-recoverable.`}
                customIcon={<TrashIcon size={20} />}
              />
            </TableCell>
          </TableRow>
        ))}
    </TableBody>
  );
};

export default EvaluationTableBody;
