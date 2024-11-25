import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
  Stack,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import Placeholder from "../../../assets/imgs/empty-state.svg";
import { Vendor } from "../../../mocks/vendors/vendors.data";
import IconButton from "../../IconButton";
import singleTheme from "../../../themes/v1SingleTheme";
// import { getAllEntities } from "../../../../application/repository/entity.repository";
import { formatDate } from "../../../tools/isoDateToString";
// import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
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

//temporary mock data for testing purposes
const mockVendors: Vendor[] = [
  {
    //all mock placeholder values
    id: 1,
    projectId: 101,
    vendorName: "Vendor A",
    assignee: "John Doe",
    vendorProvides: "Cloud Services",
    website: "https://vendor-a.com",
    vendorContactPerson: "Alice Johnson",
    reviewResult: "Passed",
    reviewStatus: "Under Review",
    reviewer: "Reviewer A",
    riskStatus: "Active",
    reviewDate: new Date("2024-11-24"),
    riskDescription: "Minimal risk",
    impactDescription: "Low impact",
    impact: 1,
    probability: 1,
    actionOwner: "John Manager",
    actionPlan: "Monitor vendor activities",
    riskSeverity: 1,
    riskLevel: "Low risk",
    likelihood: 1,
  },
  {
    id: 2,
    projectId: 102,
    vendorName: "Vendor B",
    assignee: "Jane Smith",
    vendorProvides: "AI Compliance Tools",
    website: "https://vendor-b.com",
    vendorContactPerson: "Bob Anderson",
    reviewResult: "Failed",
    reviewStatus: "Completed",
    reviewer: "Reviewer B",
    riskStatus: "Not active",
    reviewDate: new Date("2024-10-15"),
    riskDescription: "Potential delays",
    impactDescription: "Medium impact",
    impact: 2,
    probability: 2,
    actionOwner: "Jane Manager",
    actionPlan: "Create risk mitigation plan",
    riskSeverity: 2,
    riskLevel: "Medium risk",
    likelihood: 2,
  },
];

const TableWithPlaceholder = () => {
  const theme = useTheme();
  // const { dashboardValues, setDashboardValues } = useContext(VerifyWiseContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dropdownAnchor, setDropdownAnchor] = useState<HTMLElement | null>(
    null
  ); //dropdown state for the menu

  //mocking data, will be replaced with actual context or api
  const vendors = mockVendors;

  // const fetchVendors = async () => {
  //   try {
  //     const response = await getAllEntities({ routeUrl: "/vendors" });
  //     console.log("response ===> ", response);
  //     setDashboardValues((prevValues: any) => ({
  //       ...prevValues,
  //       vendors: response.data,
  //     }));
  //   } catch (error) {
  //     console.error("Error fetching vendors:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchVendors();
  // }, []);

  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  //dropdown close functions

  const handleDropdownClose = () => {
    setDropdownAnchor(null);
  };

  const getRange = () => {
    let start = page * rowsPerPage + 1;
    let end = Math.min(page * rowsPerPage + rowsPerPage, vendors.length); // replaced "dashboardValues.vendors.length" with mockVendors
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
      {vendors
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
            <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
              {/* dropdown for actions */}
              <IconButton vendorId={row.id}></IconButton>
              <Menu
                anchorEl={dropdownAnchor}
                open={Boolean(dropdownAnchor)}
                onClose={handleDropdownClose}
              >
                <MenuItem onClick={handleDropdownClose}>Edit</MenuItem>
                <MenuItem onClick={handleDropdownClose}>Remove</MenuItem>
              </Menu>
            </TableCell>
          </TableRow>
        ))}
    </TableBody>
  );

  return (
    <>
      <TableContainer>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          {tableHeader}
          {tableBody}
        </Table>
        {!vendors.length && (
          <div
            style={{
              display: "grid",
              justifyContent: "center",
              alignItems: "center",
              border: "1px solid #EEEEEE",
              borderRadius: "4px",
              borderTop: "none",
              padding: theme.spacing(15, 5),
              paddingBottom: theme.spacing(20),
              gap: theme.spacing(10),
            }}
          >
            <img src={Placeholder} alt="Placeholder" />
            <Typography sx={{ fontSize: "13px", color: "#475467" }}>
              There is currently no data in this table.
            </Typography>
          </div>
        )}
      </TableContainer>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={theme.spacing(4)}
        sx={{
          "& p": {
            color: theme.palette.text.tertiary,
          },
        }}
      >
        <Typography px={theme.spacing(2)} fontSize={12} sx={{ opacity: 0.7 }}>
          Showing {getRange()} of {vendors.length} vendor(s)
        </Typography>
        <TablePagination
          count={vendors.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 15, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
          ActionsComponent={(props) => <TablePaginationActions {...props} />}
          labelRowsPerPage="Rows per page"
          labelDisplayedRows={({ page, count }) =>
            `Page ${page + 1} of ${Math.max(0, Math.ceil(count / rowsPerPage))}`
          }
          slotProps={{
            select: {
              MenuProps: {
                keepMounted: true,
                PaperProps: {
                  className: "pagination-dropdown",
                  sx: {
                    mt: 0,
                    mb: theme.spacing(2),
                  },
                },
                transformOrigin: { vertical: "bottom", horizontal: "left" },
                anchorOrigin: { vertical: "top", horizontal: "left" },
                sx: { mt: theme.spacing(-2) },
              },
              inputProps: { id: "pagination-dropdown" },
              IconComponent: SelectorVertical,
              sx: {
                ml: theme.spacing(4),
                mr: theme.spacing(12),
                minWidth: theme.spacing(20),
                textAlign: "left",
                "&.Mui-focused > div": {
                  backgroundColor: theme.palette.background.main,
                },
              },
            },
          }}
          sx={{
            mt: theme.spacing(6),
            color: theme.palette.text.secondary,
            "& .MuiSelect-icon": {
              width: "24px",
              height: "fit-content",
            },
            "& .MuiSelect-select": {
              width: theme.spacing(10),
              borderRadius: theme.shape.borderRadius,
              border: `1px solid ${theme.palette.border.light}`,
              padding: theme.spacing(4),
            },
          }}
        />
      </Stack>
    </>
  );
};

export default TableWithPlaceholder;
