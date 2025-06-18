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
  Box,
  Tooltip,
  TableFooter,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import Placeholder from "../../../assets/imgs/empty-state.svg";
import singleTheme from "../../../themes/v1SingleTheme";
import IconButton from "../../IconButton";
import TablePaginationActions from "../../TablePagination";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";
import { RISK_LABELS } from "../../RiskLevel/constants";
import { VendorDetails } from "../../../pages/Vendors";
import { VendorRisk } from "../../../../domain/types/VendorRisk";

const titleOfTableColumns = [
  "risk description",
  "vendor",
  "project",
  "action owner",
  "risk severity",
  "likelihood",
  "risk level",
  " ",
];

interface RiskTableProps {
  users: any;
  vendors: VendorDetails[];
  vendorRisks: any;
  onDelete: (riskId: number) => void;
  onEdit: (riskId: number) => void;
  isDeletingAllowed?: boolean;
}

const RiskTable: React.FC<RiskTableProps> = ({
  users,
  vendors,
  vendorRisks,
  onDelete,
  onEdit,
  isDeletingAllowed = true,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dropdownAnchor, setDropdownAnchor] = useState<HTMLElement | null>(
    null
  );
  const cellStyle = singleTheme.tableStyles.primary.body.cell;
  const formattedUsers = users?.map((user: any) => ({
    _id: user.id,
    name: `${user.name} ${user.surname}`,
  }));

  const formattedVendors = useMemo(() => {
    return vendors.map((vendor: VendorDetails) => ({
      _id: vendor.id,
      name: vendor.vendor_name,
    }));
  }, [vendors]);

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
      vendorRisks?.length ?? 0
    );
    return `${start} - ${end}`;
  }, [page, rowsPerPage, vendorRisks?.length ?? 0]);

  // Group risks by id so each risk appears only once, and collect all project titles
  const groupedRisks: Record<
    number,
    VendorRisk & { project_titles: string[] }
  > = {};
  vendorRisks?.forEach((row: VendorRisk & { project_title?: string }) => {
    const key = row.risk_id!;
    if (!groupedRisks[key]) {
      groupedRisks[key] = {
        ...row,
        project_titles: row.project_title ? [row.project_title] : [],
      };
    } else if (row.project_title) {
      groupedRisks[key].project_titles.push(row.project_title);
    }
  });
  const uniqueRisks = Object.values(groupedRisks).map((risk) => ({
    ...risk,
    project_titles: Array.from(new Set(risk.project_titles)).join(", "),
  }));

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
              key={index}
              style={{
                ...singleTheme.tableStyles.primary.header.cell,
                ...(cell === "risk level" ? {} : {}),
                ...(index === titleOfTableColumns.length - 1
                  ? {
                      position: "sticky",
                      right: 0,
                      zIndex: 10,
                      backgroundColor:
                        singleTheme.tableStyles.primary.header.backgroundColors,
                    }
                  : {}),
              }}
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
        {uniqueRisks &&
          uniqueRisks
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row: VendorRisk & { project_titles: string }) => (
              <TableRow
                key={row.risk_id}
                sx={singleTheme.tableStyles.primary.body.row}
                onClick={() => onEdit(row.risk_id!)}
              >
                <TableCell sx={cellStyle}>{row.risk_description}</TableCell>
                <TableCell sx={cellStyle}>
                  {
                    formattedVendors?.find(
                      (vendor: any) => vendor._id === row.vendor_id
                    )?.name
                  }
                </TableCell>
                <TableCell
                  sx={{
                    ...cellStyle,
                    maxWidth: 200,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {(() => {
                    const projects = (row.project_titles as string)
                      .split(",")
                      .map((p) => p.trim());
                    const displayCount = 1;
                    const showMore = projects.length > displayCount;
                    const displayed = projects
                      .slice(0, displayCount)
                      .join(", ");
                    const moreCount = projects.length - displayCount;
                    return (
                      <Tooltip
                        title={
                          <>
                            {projects.map((title, idx) => (
                              <div key={idx}>{title}</div>
                            ))}
                          </>
                        }
                        arrow
                        placement="top"
                        sx={{ fontSize: 13 }}
                      >
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            cursor: "pointer",
                            width: "100%",
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 150,
                              display: "inline-block",
                              verticalAlign: "middle",
                            }}
                          >
                            {displayed}
                          </span>
                          {showMore && (
                            <span
                              style={{
                                color: "#888",
                                marginLeft: 4,
                                fontWeight: 500,
                              }}
                            >
                              +{moreCount}
                            </span>
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })()}
                </TableCell>
                <TableCell sx={cellStyle}>
                  {
                    formattedUsers?.find(
                      (user: any) => user._id === row.action_owner
                    )?.name
                  }
                </TableCell>
                <TableCell sx={cellStyle}>{row.risk_severity}</TableCell>
                <TableCell sx={cellStyle}>{row.likelihood}</TableCell>
                <TableCell sx={cellStyle}>
                  <Box
                    sx={{
                      backgroundColor:
                        Object.values(RISK_LABELS).find(
                          (risk) => risk.text === row.risk_level
                        )?.color || "transparent",
                      borderRadius: theme.shape.borderRadius,
                      padding: "8px",
                      textAlign: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    {row.risk_level}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    position: "sticky",
                    right: 0,
                    zIndex: 10,
                    minWidth: "50px",
                  }}
                >
                  {isDeletingAllowed && (
                    <IconButton
                      id={row.risk_id!}
                      onDelete={() => onDelete(row.risk_id!)}
                      onEdit={() => onEdit(row.risk_id!)}
                      onMouseEvent={() => {}}
                      warningTitle="Delete this risk?"
                      warningMessage="This action is non-recoverable."
                      type="Risk"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    ),
    [
      uniqueRisks,
      page,
      rowsPerPage,
      cellStyle,
      dropdownAnchor,
      handleDropdownClose,
    ]
  );

  return (
    <>
      {/* Empty state outside the table */}
      {!vendorRisks || vendorRisks.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            border: "1px solid #EEEEEE",
            borderRadius: "4px",
            padding: theme.spacing(15, 5),
            paddingBottom: theme.spacing(20),
            gap: theme.spacing(10),
            minHeight: 200,
          }}
        >
          <img src={Placeholder} alt="Placeholder" />
          <Typography sx={{ fontSize: "13px", color: "#475467" }}>
            There is currently no data in this table.
          </Typography>
        </Stack>
      ) : (
        <TableContainer>
          <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
            {tableHeader}
            {tableBody}
            <TableFooter>
              <TableRow
                sx={{
                  "& .MuiTableCell-root.MuiTableCell-footer": {
                    paddingX: theme.spacing(8),
                    paddingY: theme.spacing(4),
                  },
                }}
              >
                <TableCell
                  sx={{
                    paddingX: theme.spacing(2),
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  Showing {getRange} of {vendorRisks?.length} vendor risk(s)
                </TableCell>
                <TablePagination
                  count={vendorRisks?.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 15, 25]}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
                  labelRowsPerPage="Rows per page"
                  labelDisplayedRows={({ page, count }) =>
                    `Page ${page + 1} of ${Math.max(
                      0,
                      Math.ceil(count / rowsPerPage)
                    )}`
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
                        transformOrigin: {
                          vertical: "bottom",
                          horizontal: "left",
                        },
                        anchorOrigin: {
                          vertical: "top",
                          horizontal: "left",
                        },
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
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default RiskTable;
