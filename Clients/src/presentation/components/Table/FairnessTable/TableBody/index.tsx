import { TableBody, TableRow, TableCell, Button, Typography, Box } from "@mui/material";
import singleTheme from '../../../../themes/v1SingleTheme';

interface FairnessTableBodyProps {
  rows: any[];
  page: number;
  rowsPerPage: number;
  onShowDetails: (model: any) => void;
  onRemoveModel: (id: number) => void;
}

const FairnessTableBody: React.FC<FairnessTableBodyProps> = ({
  rows,
  page,
  rowsPerPage,
  onShowDetails,
}) => {
  return (
    <TableBody>
    {rows
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map((row, index) => (
        <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row}>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
            {row.id}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
            {row.model}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
            {row.dataset}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
            <Typography
              sx={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "12px",
                backgroundColor: row.status === "Completed" ? "#DCFCE7" : "#FEF3C7",
                color: row.status === "Completed" ? "#166534" : "#92400E",
                fontWeight: 500,
                fontSize: "12px",
                textTransform: "capitalize",
                width: "fit-content",
              }}
            >
              {row.status}
            </Typography>
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
            <Box display="flex" justifyContent="left">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => onShowDetails(row)}
                sx={{ textTransform: "none", fontSize: "13px", px: 2 }}
              >
                Show report
              </Button>
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>

  );
};

export default FairnessTableBody;
