import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";

import Placeholder from "../../../assets/imgs/table placeholder 1.png";

function TableWithPlaceholder() {
  const theme = useTheme();

  return (
    <TableContainer style={{ marginBottom: theme.spacing(15) }}>
      <Table
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          "& td, & th": {
            border: 0,
          },
        }}
      >
        <TableHead
          sx={{
            backgroundColor: "#FAFAFA",
          }}
        >
          <TableRow
            sx={{
              textTransform: "uppercase",
              borderBottom: "1px solid #EEEEEE",
            }}
          >
            {["name", "type", "assignee", "status", "risk", "review date"].map(
              (cell, index) => (
                <TableCell style={{ color: "#667085" }} key={index}>
                  {cell}
                </TableCell>
              )
            )}
          </TableRow>
        </TableHead>
      </Table>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          borderTop: "none",
          padding: theme.spacing(5),
          paddingBottom: theme.spacing(20),
        }}
      >
        <img src={Placeholder} alt="Placeholder" />
      </div>
    </TableContainer>
  );
}

export default TableWithPlaceholder;
