import { TableBody, TableRow, TableCell, Button } from "@mui/material";
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
            <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
              {row.name}
            </TableCell>
            <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
              {row.lastUpdated}
            </TableCell>
            <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
              {row.status}
            </TableCell>
            <TableCell
              sx={{
                ...singleTheme.tableStyles.primary.body.cell,
                textAlign: "right",
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                onClick={() => onShowDetails(row)}
              >
                Show Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
    </TableBody>
  );
};

export default FairnessTableBody;
