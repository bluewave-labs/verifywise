import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
  Typography
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import Placeholder from "../../../assets/imgs/empty-state.svg";
import { Vendor } from "../../../mocks/vendors/vendors.data";
import IconButton from "../../IconButton";
import singleTheme from "../../../themes/v1SingleTheme";
import { getAllEntities } from "../../../../application/repository/entity.repository";
import { formatDate } from "../../../tools/isoDateToString";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import TablePaginationActions from "../../TablePagination";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";

const titleOfTableColumns = [
  "name",
  "assignee",
  "status",
  "risk",
  "review date",
  "",
];

const TableWithPlaceholder = () => {
  const theme = useTheme();
  const { dashboardValues, setDashboardValues } = useContext(VerifyWiseContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchVendors = async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/vendors" });
      console.log("response ===> ", response);
      setDashboardValues((prevValues: any) => ({
        ...prevValues,
        vendors: response.data,
      }));
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRange = () => {
    let start = page * rowsPerPage + 1;
    let end = Math.min(
      page * rowsPerPage + rowsPerPage,
      dashboardValues.vendors.length
    );
    return `${start} - ${end}`;
  };

  const tableHeader: JSX.Element = (
    <TableHead
      sx={{
        backgroundColors:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {titleOfTableColumns.map((cell, index) => (
          <TableCell
            style={singleTheme.tableStyles.primary.header.cell}
            key={index}
          >
            {cell}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const tableBody: JSX.Element = (
    <TableBody>
      {dashboardValues.vendors &&
        dashboardValues.vendors
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((row: Vendor, index: number) => (
            <TableRow key={index} sx={singleTheme.tableStyles.primary.body.row}>
              <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                {row.vendorName}
              </TableCell>
              <TableCell sx={cellStyle}>{row.assignee}</TableCell>
              <TableCell sx={cellStyle}>{row.reviewStatus}</TableCell>
              <TableCell sx={cellStyle}>{row.riskStatus}</TableCell>
              <TableCell sx={cellStyle}>
                {formatDate(row.reviewDate.toString())}
              </TableCell>
              <TableCell sx={cellStyle}>
                <IconButton vendorId={row.id} />
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );

  return (
    <TableContainer>
      <Table sx={singleTheme.tableStyles.primary.frame}>
        {tableHeader}
        {tableBody}
      </Table>
      {!dashboardValues.vendors.length && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            border: "1px solid #EEEEEE",
            borderRadius: "4px",
            borderTop: "none",
            padding: theme.spacing(5),
            paddingTop: theme.spacing(10),
            paddingBottom: theme.spacing(20),
            marginTop: theme.spacing(4),
          }}
        >
          <img src={Placeholder} alt="Placeholder"
          style={{width: "150px",
          height:"auto",
          marginTop: theme.spacing(4),
          marginBottom:theme.spacing(4)}} />
          <Typography variant="body2" color="text.secondary" style={{marginTop: theme.spacing(4)}}>
            There is currently no data in this table
          </Typography>
        </div>
      )}
    </TableContainer>
  );
};

export default TableWithPlaceholder;
