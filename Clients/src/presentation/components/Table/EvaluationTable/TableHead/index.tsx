import { TableHead, TableRow, TableCell } from "@mui/material";
import singleTheme from "../../../../themes/v1SingleTheme";

// Column width definitions for consistent spacing
const columnWidths: Record<string, string> = {
  "EXPERIMENT ID": "18%",
  "MODEL": "10%",
  "JUDGE": "14%",
  "# PROMPTS": "7%",
  "DATASET": "12%",
  "STATUS": "9%",
  "DATE": "14%", // Wider to fit date + time
  "ACTION": "60px",
};

const TableHeader = ({ columns }: { columns: string[] }) => {
  // Columns that should be center-aligned
  const centerAlignedColumns = ["MODEL", "JUDGE", "# PROMPTS", "DATASET", "STATUS", "DATE", "ACTION"];

  return (
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
                      minWidth: "60px",
                      maxWidth: "60px",
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
  );
};

export default TableHeader;

