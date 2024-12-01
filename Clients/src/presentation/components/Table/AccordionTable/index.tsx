import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { useMemo } from "react";

interface ITableCol {
  id: number;
  name: string;
}

const AccordionTable = ({
  id,
  cols,
  rows,
}: {
  id: any;
  cols: ITableCol[];
  rows: any[];
}) => {
  const tableHeader = useMemo(
    () => (
      <TableHead
        className="accordion-table-header"
        sx={{
          backgroundColors:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow className="accordion-table-header-row">
          {cols.map((col: ITableCol) => (
            <TableCell
              className="accordion-table-header-cell"
              style={singleTheme.tableStyles.primary.header.cell}
              key={col.id}
            >
              {col.name}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    ),
    [cols]
  );

  const cellStyle = {
    ...singleTheme.tableStyles.primary.body.row,
    height: "36px",
    "&:hover": {
      backgroundColor: "#FBFBFB",
      cursor: "pointer",
    },
  };

  const tableBody = useMemo(
    () => (
      <TableBody className="accordion-table-body">
        {rows.map((row) => (
          <TableRow
            className="accordion-table-body-row"
            key={row.id}
            sx={{
              ...singleTheme.tableStyles.primary.body.row,
              height: "36px",
              "&:hover": {
                backgroundColor: "#FBFBFB",
                cursor: "pointer",
              },
            }}
          >
            {row.icon && (
              <TableCell sx={cellStyle} key={`icon-${row.id}`}>
                <img src={row.icon} alt="status icon" width={20} />
              </TableCell>
            )}
            {row.title && (
              <TableCell sx={cellStyle} key={`${id}-${row.id}`}>
                {id}.{row.id} {row.title}{" "}
                {`(${row.description}`.substring(0, 20) + `...)`}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    ),
    []
  );

  return (
    <TableContainer className="accordion-table-container">
      <Table className="accordion-table">
        {tableHeader}
        {tableBody}
      </Table>
    </TableContainer>
  );
};

export default AccordionTable;
