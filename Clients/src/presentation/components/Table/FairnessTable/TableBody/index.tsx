import { TableBody, TableRow, TableCell, Typography, Box, IconButton } from "@mui/material";
import singleTheme from '../../../../themes/v1SingleTheme';
import trash from '../../../../assets/icons/trash-01.svg'
import Button from '../../../../components/Button/index'


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
  onRemoveModel,
}) => {
  return (
    <TableBody>
    {rows
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map((row, index) => (
        <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row}>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px"}}>
            {row.id}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px", textTransform:"none"}}>
            {row.model}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px", textTransform:"none" }}>
            {row.dataset}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
          <Box display="flex" justifyContent="left">
            <Button 
            onClick={() => onShowDetails(row)}
            sx={{ml: -2, fontsize:"18 !important"}}
            >
              Show
            </Button>

            </Box>
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
            <IconButton onClick={() => onRemoveModel(row.id)} sx={{ padding: 0, ml: 5}}>
              <img src={trash} alt="Delete" style={{ width: '20px', height: '20px' }} />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>

  );
};

export default FairnessTableBody;
