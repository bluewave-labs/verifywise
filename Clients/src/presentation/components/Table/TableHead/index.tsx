import { TableHead, TableRow, TableCell } from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";

// Column width definitions for consistent spacing
const columnWidths: Record<string, string> = {
  "EXPERIMENT ID": "18%",
  "MODEL": "14%",
  "JUDGE": "10%",
  "# PROMPTS": "14%",
  "DATASET": "8%",
  "STATUS": "14%",
  "DATE": "14%",
  "ACTION": "80px",
};

const TableHeader = ({ columns }: { columns: string[] }) => {
  // Columns that should be center-aligned
  const centerAlignedColumns = ["MODEL", "JUDGE", "# PROMPTS", "STATUS", "DATE"];

  return (
    <>
      <TableHead
        sx={{
          backgroundColor:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow sx={singleTheme.tableStyles.primary.header.row}>
          {columns.map((column, index) => {
            const isActionColumn = column === "ACTION" || column === "Actions";
            const isCenterAligned = centerAlignedColumns.includes(column);
            const width = columnWidths[column];
            return (
              <TableCell
                key={index}
                style={{
                  ...singleTheme.tableStyles.primary.header.cell,
                  width: width || "auto",
                  ...(isActionColumn
                    ? {
                        minWidth: "80px",
                        maxWidth: "80px",
                      }
                    : {}),
                  ...(isCenterAligned
                    ? {
                        textAlign: "center",
                      }
                    : {}),
                }}
              >
                {column}
              </TableCell>
            );
          })}
        </TableRow>
      </TableHead>
    </>
  );
};

export default TableHeader;
