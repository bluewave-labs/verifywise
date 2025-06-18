import { TableBody, TableRow, TableCell, Box } from "@mui/material";
import singleTheme from '../../../../themes/v1SingleTheme';
import trash from '../../../../assets/icons/trash-02.svg';
import Button from '../../../../components/Button/index';
import ConfirmableDeleteIconButton from "../../../../components/Modals/ConfirmableDeleteIconButton";


interface FairnessTableBodyProps {
  rows: any[];
  page: number;
  rowsPerPage: number;
  onShowDetails: (model: any) => void;
  onRemoveModel: {
    onConfirm: (id: number) => void;
  };
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
      .map((row) => (
        <TableRow key={row.id} sx={singleTheme.tableStyles.primary.body.row}>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px", textTransform:"none", width:"20%"}}>
          {row.status === "In Progress" ? "Pending..." : row.id}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px", textTransform:"none"}}>
            {row.model}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px", textTransform:"none" }}>
            {row.dataset}
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px", textTransform:"none" }}>
            <Box sx={{ width: "30%", ml:-5 }}>
              <StatusBadge status={row.status} />
            </Box>
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
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
            }}
            >
              Show
            </Button>

            </Box>
          </TableCell>
          <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, paddingLeft: "12px", paddingRight: "12px" }}>
          <ConfirmableDeleteIconButton
            id={row.id}
            onConfirm={() => onRemoveModel.onConfirm(row.id)}
            title={`Delete this fairness check?`}
            message={`Are you sure you want to delete fairness check ID ${row.id}? This action is non-recoverable.`}
            customIcon={<img src={trash} alt="Delete" style={{ width: '20px', height: '20px' }} />}
          />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>

  );
};

export default FairnessTableBody;
