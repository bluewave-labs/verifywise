import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import { singleTheme } from "../../../themes";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { sendSlackMessage } from "../../../../application/repository/slack.integration.repository";
import { useState } from "react";
import { formatDate } from "../../../tools/isoDateToString";
import { SlackWebhook } from "../../../../application/hooks/useSlackIntegrations";
import { vwhomeHeading } from "../../Home/1.0Home/style";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { viewProjectButtonStyle } from "../../../components/Cards/ProjectCard/style";

interface SlackIntegrationsProps {
  integrationData: SlackWebhook[];
}

const SlackIntegrations = ({ integrationData }: SlackIntegrationsProps) => {
  const [page, setPage] = useState(0); // Current page
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page
  const theme = useTheme();

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const TABLE_COLUMNS = [
    { id: "teamName", label: "TEAM NAME" },
    { id: "channel", label: "CHANNEL" },
    { id: "createdAt", label: "CREATION DATE" },
    { id: "isActive", label: "ACTIVE" },
    { id: "action", label: "ACTION" },
  ];

  const handleSlackTestClick = (id?: number) => async () => {
    if (!id) return;
    try {
      const msg = await sendSlackMessage({
        id,
        body: {
          title: "Welcome to Verifywise",
          message: "This is a test message from VerifyWise.",
        },
      });
      if (msg.data.success) {
        console.log("Test message sent successfully:", msg);
      }
    } catch (error) {
      console.error("Error sending test message:", error);
    }
  };

  return (
    <Box sx={{ mt: 8 }}>
      <Typography sx={vwhomeHeading}>Integrations</Typography>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ ...singleTheme.tableStyles.primary.frame }}>
          <TableHead
            sx={{
              backgroundColor:
                singleTheme.tableStyles.primary.header.backgroundColors,
            }}
          >
            <TableRow>
              {TABLE_COLUMNS.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    ...singleTheme.tableStyles.primary.header.cell,
                    ...(column.id === "action" && {
                      position: "sticky",
                      right: 0,
                      backgroundColor:
                        singleTheme.tableStyles.primary.header.backgroundColors,
                    }),
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {integrationData.length > 0 ? (
              integrationData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                ?.map((item) => (
                  <TableRow
                    key={item.id}
                    sx={singleTheme.tableStyles.primary.body.row}
                  >
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {item.teamName}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...singleTheme.tableStyles.primary.body.cell,
                        textTransform: "none",
                      }}
                    >
                      {item.channel}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...singleTheme.tableStyles.primary.body.cell,
                        textTransform: "none",
                      }}
                    >
                      {item.createdAt
                        ? formatDate(item.createdAt.toString())
                        : ""}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...singleTheme.tableStyles.primary.body.cell,
                        textTransform: "none",
                      }}
                    >
                      {item.isActive ? "Yes" : "No"}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...singleTheme.tableStyles.primary.body.cell,
                        textTransform: "none",
                        position: "sticky",
                        right: 0,
                      }}
                    >
                      <CustomizableButton
                        variant="outlined"
                        onClick={handleSlackTestClick(item.id)}
                        size="small"
                        text="Send Test"
                        sx={viewProjectButtonStyle}
                      />
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow sx={singleTheme.tableStyles.primary.body.row}>
                {TABLE_COLUMNS.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={singleTheme.tableStyles.primary.body.cell}
                  >
                    -
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                count={integrationData.length}
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
                    Math.ceil(count / rowsPerPage),
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
                    border: `1px solid ${theme.palette.border.light}`,
                    padding: theme.spacing(4),
                  },
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SlackIntegrations;
