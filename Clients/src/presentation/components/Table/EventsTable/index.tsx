import React, { useState, useCallback, useMemo } from "react";
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
} from "@mui/material";
import TablePaginationActions from "../../TablePagination";
import singleTheme from "../../../themes/v1SingleTheme";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";
import Placeholder from "../../../assets/imgs/empty-state.svg";
import { formatDateTime } from "../../../tools/isoDateToString";
import { Event } from "../../../../domain/types/Event";
import { User } from "../../../../domain/types/User";

const TABLE_COLUMNS = [
  { id: "id", label: "ID" },
  { id: "event_type", label: "EVENT TYPE" },
  { id: "description", label: "DESCRIPTION" },
  { id: "user_id", label: "USER (ID)" },
  { id: "timestamp", label: "TIMESTAMP" },
];

interface EventsTableProps {
  data: Event[];
  users?: User[];
  isLoading?: boolean;
  paginated?: boolean;
}

const DEFAULT_ROWS_PER_PAGE = 5;

const EventTypeBadge: React.FC<{ eventType: Event["event_type"] }> = ({
  eventType,
}) => {
  const eventTypeStyles = {
    Create: { bg: "#c8e6c9", color: "#388e3c" },
    Read: { bg: "#bbdefb", color: "#1976d2" },
    Update: { bg: "#fff9c4", color: "#fbc02d" },
    Delete: { bg: "#ffcdd2", color: "#d32f2f" },
    Error: { bg: "#ffccbc", color: "#e64a19" },
  };

  const style = eventTypeStyles[eventType] || {
    bg: "#e0e0e0",
    color: "#424242",
  };

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "4px 8px",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {eventType}
    </span>
  );
};

const EventsTable: React.FC<EventsTableProps> = ({
  data,
  users = [],
  isLoading,
  paginated = true,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  // Format users data like other tables do
  const formattedUsers = useMemo(() => {
    return users?.map((user: User) => ({
      _id: user.id,
      name: `${user.name} ${user.surname}`,
    }));
  }, [users]);

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

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, data?.length ?? 0);
    return `${start} - ${end}`;
  }, [page, rowsPerPage, data?.length]);

  const tableHeader = useMemo(
    () => (
      <TableHead
        sx={{
          backgroundColor:
            singleTheme.tableStyles.primary.header.backgroundColors,
        }}
      >
        <TableRow sx={singleTheme.tableStyles.primary.header.row}>
          {TABLE_COLUMNS.map((column) => (
            <TableCell
              key={column.id}
              sx={{
                ...singleTheme.tableStyles.primary.header.cell,
                width:
                  column.id === "description"
                    ? "auto"
                    : column.id === "id"
                    ? "80px"
                    : "fit-content",
                whiteSpace: column.id === "description" ? "normal" : "nowrap",
              }}
            >
              {column.label}
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
        {data?.length > 0 ? (
          data
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((event) => (
              <TableRow
                key={event.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  "&:hover": { backgroundColor: "#FBFBFB", cursor: "pointer" },
                }}
              >
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    width: "80px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.id}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    width: "fit-content",
                    whiteSpace: "nowrap",
                  }}
                >
                  <EventTypeBadge eventType={event.event_type} />
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    width: "auto",
                    whiteSpace: "normal",
                  }}
                >
                  {event.description}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    width: "fit-content",
                    whiteSpace: "nowrap",
                  }}
                >
                  {(() => {
                    const userName = formattedUsers?.find(
                      (user: any) => user._id === event.user_id
                    )?.name;
                    return userName
                      ? `${userName} (${event.user_id})`
                      : event.user_id;
                  })()}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    width: "fit-content",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.timestamp ? formatDateTime(event.timestamp) : "N/A"}
                </TableCell>
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={TABLE_COLUMNS.length}
              align="center"
              sx={{ py: 4 }}
            >
              No event data available.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    ),
    [data, page, rowsPerPage, formattedUsers]
  );

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          border: "1px solid #EEEEEE",
          borderRadius: "4px",
          padding: theme.spacing(15, 5),
          minHeight: 200,
        }}
      >
        <Typography>Loading...</Typography>
      </Stack>
    );
  }

  if (!data || data.length === 0) {
    return (
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
    );
  }

  return (
    <Stack spacing={0}>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          {tableHeader}
          {tableBody}
        </Table>
      </TableContainer>

      {paginated && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: theme.spacing(3, 4),
            paddingBottom: 0,
            backgroundColor: theme.palette.grey[50],
            border: `1px solid ${theme.palette.border.light}`,
            borderTop: "none",
            borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
          }}
        >
          <Typography
            sx={{
              fontSize: "13px",
              color: theme.palette.text.secondary,
            }}
          >
            Showing {getRange} of {data?.length} event
            {data?.length !== 1 ? "s" : ""}
          </Typography>

          <TablePagination
            count={data?.length ?? 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 15, 25]}
            onRowsPerPageChange={handleChangeRowsPerPage}
            ActionsComponent={(props) => <TablePaginationActions {...props} />}
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
              mt: 0,
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
        </Box>
      )}
    </Stack>
  );
};

export default EventsTable;
