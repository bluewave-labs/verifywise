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
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import Placeholder from "../../../assets/imgs/empty-state.svg";
import IconButton from "../../IconButton";
import singleTheme from "../../../themes/v1SingleTheme";
import { formatDate } from "../../../tools/isoDateToString";
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

interface TableWithPlaceholderProps {
  dashboardValues: any;
  onVendorChange: () => void;
  onDeleteVendor: (vendorId: number) => void;
}

const TableWithPlaceholder: React.FC<TableWithPlaceholderProps> = ({
  dashboardValues,
  onVendorChange,
  onDeleteVendor,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dropdownAnchor, setDropdownAnchor] = useState<HTMLElement | null>(
    null
  );
  const cellStyle = singleTheme.tableStyles.primary.body.cell;

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const handleDropdownClose = useCallback(() => {
    setDropdownAnchor(null);
  }, []);

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(
      page * rowsPerPage + rowsPerPage,
      dashboardValues.vendors.length
    );
    return `${start} - ${end}`;
  }, [page, rowsPerPage, dashboardValues.vendors.length]);

  const tableHeader = useMemo(
    () => (
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
    ),
    []
  );

  const tableBody = useMemo(
    () => (
      <TableBody>
        {dashboardValues.vendors &&
          dashboardValues.vendors
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row: any, index: number) => (
              <TableRow
                key={index}
                sx={singleTheme.tableStyles.primary.body.row}
              >
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {row.vendor_name}
                </TableCell>
                <TableCell sx={cellStyle}>{row.assignee}</TableCell>
                <TableCell sx={cellStyle}>{row.review_status}</TableCell>
                <TableCell sx={cellStyle}>{row.risk_status}</TableCell>
                <TableCell sx={cellStyle}>
                  {row.review_date
                    ? formatDate(row.review_date.toString())
                    : "No review date"}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <IconButton
                    vendorId={row.id}
                    onVendorChange={onVendorChange}
                    onDeleteVendor={onDeleteVendor}
                  ></IconButton>
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    ),
    [
      dashboardValues.vendors,
      page,
      rowsPerPage,
      cellStyle,
      dropdownAnchor,
      handleDropdownClose,
    ]
  );

  return (
    <>
      <TableContainer>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          {tableHeader}
          {tableBody}
        </Table>
        {!dashboardValues.vendors.length && (
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
          Showing {getRange} of {dashboardValues.vendors.length} vendor(s)
        </Typography>
        <TablePagination
          count={dashboardValues.vendors.length}
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
