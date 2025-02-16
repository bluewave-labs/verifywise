import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Typography,
  LinearProgress,
  useTheme,
} from "@mui/material";
import singleTheme from "../../../themes/v1SingleTheme";
import { Fragment, useCallback, useMemo, useState } from "react";
import NewControlPane from "../../Modals/Controlpane/NewControlPane";
import { Control } from "../../../../domain/Control";

interface ITableCol {
  id: number;
  name: string;
}

const AccordionTable = ({
  id,
  cols,
  rows,
  controlCategoryId,
}: {
  id: any;
  cols: ITableCol[];
  rows: any[];
  controlCategoryId: string;
}) => {
  const theme = useTheme();
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const getProgressColor = useCallback((value: number) => {
    if (value <= 10) return "#FF4500"; // 0-10%
    if (value <= 20) return "#FF4500"; // 11-20%
    if (value <= 30) return "#FFA500"; // 21-30%
    if (value <= 40) return "#FFD700"; // 31-40%
    if (value <= 50) return "#E9F14F"; // 41-50%
    if (value <= 60) return "#CDDD24"; // 51-60%
    if (value <= 70) return "#64E730"; // 61-70%
    if (value <= 80) return "#32CD32"; // 71-80%
    if (value <= 90) return "#228B22"; // 81-90%
    return "#008000"; // 91-100%
  }, []);

  const tableHeader = useMemo(
    () => (
      <TableHead
        id={`${id}-table-header`}
        className="accordion-table-header"
        sx={{
          backgroundColors:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow className="accordion-table-header-row">
          {cols.map((col: ITableCol, index: number) => (
            <TableCell
              className="accordion-table-header-cell"
              style={singleTheme.tableStyles.primary.header.cell}
              key={index}
            >
              {col.name}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    ),
    [cols, id]
  );

  const cellStyle = {
    ...singleTheme.tableStyles.primary.body.row,
    height: "36px",
    "&:hover": {
      backgroundColor: "#FBFBFB",
      cursor: "pointer",
    },
  };

  const handleRowClick = (id: number) => {
    setSelectedRow(id);
    setModalOpen(true);
  };

  const sortedRows = useMemo(() => {
    return rows.slice().sort((a, b) => a.order_no - b.order_no);
  }, [rows]);

  const tableBody = useMemo(
    () => (
      <TableBody id={`${id}-table-body`} className="accordion-table-body">
        {sortedRows.map((row: Control) => (
          <Fragment key={row.id}>
            {modalOpen && selectedRow === row.id && (
              <NewControlPane
                data={row}
                isOpen={modalOpen}
                handleClose={() => setModalOpen(false)}
                OnSave={() => {
                  console.log("Save clicked");
                  // fetchComplianceTracker();
                }}
                controlCategoryId={controlCategoryId}
              />
            )}
            <TableRow
              className="accordion-table-body-row"
              key={`${id}-${row.id}-row`}
              sx={cellStyle}
              onClick={() => handleRowClick(row.id!)}
            >
              <TableCell sx={cellStyle} key={`${id}-${row.id}`}>
                {id}.{`${row.order_no}`} {row.title}{" "}
                {`(${row.description}`.substring(0, 20) + `...)`}
              </TableCell>
              <TableCell sx={cellStyle} key={`owner-${row.id}`}>
                {row.owner ? row.owner : "Not set"}
              </TableCell>
              <TableCell sx={cellStyle} key={`noOfSubControls-${row.id}`}>
                {`${row.numberOfSubcontrols} Subcontrols`}
              </TableCell>
              <TableCell sx={cellStyle} key={`completion-${row.id}`}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2">
                    {`${
                      row.numberOfSubcontrols
                        ? (
                            row.numberOfDoneSubcontrols! /
                            row.numberOfSubcontrols
                          ).toFixed(2)
                        : "0"
                    }%`}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      row.numberOfSubcontrols
                        ? (row.numberOfDoneSubcontrols! /
                            row.numberOfSubcontrols) *
                          100
                        : 0
                    }
                    sx={{
                      width: "100px",
                      height: "5px",
                      borderRadius: "4px",
                      backgroundColor: theme.palette.grey[200],
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getProgressColor(
                          row.numberOfSubcontrols
                            ? (row.numberOfDoneSubcontrols! /
                                row.numberOfSubcontrols) *
                                100
                            : 0
                        ),
                      },
                    }}
                  />
                </Stack>
              </TableCell>
            </TableRow>
          </Fragment>
        ))}
      </TableBody>
    ),
    [
      sortedRows,
      modalOpen,
      selectedRow,
      getProgressColor,
      theme.palette.grey,
      id,
    ]
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
