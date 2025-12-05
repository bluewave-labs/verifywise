import { TableBody, TableRow, TableCell, Chip, Box, IconButton, Tooltip } from "@mui/material";
import { Trash2 as TrashIcon, RotateCcw } from "lucide-react";
import singleTheme from "../../../../themes/v1SingleTheme";
import ConfirmableDeleteIconButton from "../../../../components/Modals/ConfirmableDeleteIconButton";
import { IEvaluationTableBodyProps } from "../../../../../domain/interfaces/i.table";

const StatusChip: React.FC<{
  status: "In Progress" | "Completed" | "Failed" | "Pending" | "Running" | "Available";
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
      case "Available":
        return {
          backgroundColor: "#e3f2fd",
          color: "#1565c0",
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
  onRerun,
}) => {
  return (
    <TableBody>
      {rows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((row) => {
          const isRunning = row.status === "Running" || row.status === "In Progress" || row.status === "Pending";
          
          return (
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
            {/* EXPERIMENT ID */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                width: "18%",
              }}
            >
              {isRunning ? "Pending..." : row.id}
            </TableCell>

            {/* MODEL - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                textAlign: "center",
                width: "14%",
              }}
            >
              {row.model}
            </TableCell>

            {/* JUDGE - center aligned */}
            {row.judge !== undefined && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                  textAlign: "center",
                  width: "10%",
                }}
              >
                {row.judge || "-"}
              </TableCell>
            )}

            {/* # PROMPTS - center aligned */}
            {row.prompts !== undefined && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                  textAlign: "center",
                  width: "14%",
                }}
              >
                {row.prompts}
              </TableCell>
            )}

            {/* DATASET */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                width: "8%",
              }}
            >
              {row.dataset}
            </TableCell>

            {/* STATUS - center aligned */}
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                paddingLeft: "12px",
                paddingRight: "12px",
                textTransform: "none",
                textAlign: "center",
                width: "14%",
              }}
            >
              <StatusChip status={row.status} />
            </TableCell>

            {/* DATE - center aligned */}
            {row.date !== undefined && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  textTransform: "none",
                  textAlign: "center",
                  width: "14%",
                }}
              >
                {row.date}
              </TableCell>
            )}

            {/* ACTION */}
            {(onRerun || onRemoveModel) && (
              <TableCell
                sx={{
                  ...singleTheme.tableStyles.primary.body.cell,
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  width: "80px",
                  minWidth: "80px",
                  maxWidth: "80px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {onRerun && (
                    <Tooltip title={isRunning ? "Evaluation in progress" : "Rerun this evaluation"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRerun(row);
                          }}
                          disabled={isRunning}
                          sx={{
                            color: isRunning ? "#d0d5dd" : "#13715B",
                            padding: "4px",
                            "&:hover": {
                              backgroundColor: isRunning ? "transparent" : "rgba(19, 113, 91, 0.1)",
                            },
                          }}
                        >
                          <RotateCcw size={16} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {onRemoveModel && (
                    <ConfirmableDeleteIconButton
                      disabled={false}
                      id={row.id}
                      onConfirm={(id) => onRemoveModel.onConfirm(String(id))}
                      title="Delete this evaluation?"
                      message={`Are you sure you want to delete evaluation "${row.name || row.id}"?`}
                      customIcon={<TrashIcon size={16} color="#667085" />}
                    />
                  )}
                </Box>
              </TableCell>
            )}
          </TableRow>
        );
        })}
    </TableBody>
  );
};

export default EvaluationTableBody;
