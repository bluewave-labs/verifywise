import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import { singleTheme } from "../../../themes";
import { ChevronsUpDown } from "lucide-react";

const SelectorVertical = (props: any) => (
  <ChevronsUpDown size={16} {...props} />
);
import {
  Box,
  Stack,
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
import { SlidersHorizontal } from "lucide-react";

const SliderIcon = () => <SlidersHorizontal size={20} />;
import { sendSlackMessage } from "../../../../application/repository/slack.integration.repository";
import { Suspense, useCallback, useState } from "react";
import { formatDate } from "../../../tools/isoDateToString";
import { SlackWebhook } from "../../../../application/hooks/useSlackIntegrations";
import { vwhomeHeading } from "../../Home/1.0Home/style";
import CustomizableButton from "../../../components/Button/CustomizableButton";
import { viewProjectButtonStyle } from "../../../components/Cards/ProjectCard/style";
import NotificationRoutingModal from "./NotificationRoutingModal";
import Popup from "../../../components/Popup";

interface SlackIntegrationsProps {
  integrationData: SlackWebhook[];
  showAlert: (
    variant: "success" | "info" | "warning" | "error",
    title: string,
    body: string,
  ) => void;
  refreshSlackIntegrations: () => void;
  slackUrl: string;
}

const SlackIntegrations = ({
  integrationData,
  showAlert,
  refreshSlackIntegrations,
  slackUrl: url,
}: SlackIntegrationsProps) => {
  const [page, setPage] = useState(0); // Current page
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page
  const theme = useTheme();

  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const handleOpenOrClose = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchor(anchor ? null : event.currentTarget);
    },
    [anchor],
  );

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
      });
      if (msg.data.success) {
        showAlert(
          "success",
          "Success",
          "Test message sent successfully to the Slack channel.",
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        let err: string = error.message;
        if (error.message.includes("is_archived")) {
          err = "The channel is archived.";
        } else if (error.message.includes("channel_not_found")) {
          err = "The channel is no longer active or available.";
        }

        refreshSlackIntegrations();
        showAlert("error", "Error", `${err}`);
      } else {
        showAlert(
          "error",
          "Error",
          `Error sending test message to the Slack channel.`,
        );
      }
    }
  };

  const PopupRender = useCallback(() => {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Popup
          popupId="notification-routing-popup"
          popupContent={
            <NotificationRoutingModal
              setIsOpen={() => setAnchor(null)}
              integrations={integrationData.map((item) => ({
                channel: item.channel,
                teamName: item.teamName,
                id: item.id,
              }))}
              showAlert={showAlert}
            />
          }
          openPopupButtonName="Save Changes"
          popupTitle="Notification Routing"
          popupSubtitle="Map Notification types to Slack channels. Set a destination channel
          for each type."
          handleOpenOrClose={handleOpenOrClose}
          anchor={anchor}
        />
      </Suspense>
    );
  }, [integrationData, handleOpenOrClose, anchor]);

  return (
    <Box sx={{ mt: 8 }}>
      <Stack
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography sx={vwhomeHeading}>Integrations</Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          {/* This is embeddable html provided by Slack */}
          <a href={`${url}`}>
            <img
              alt="Add to Slack"
              height="34"
              width="139"
              src="https://platform.slack-edge.com/img/add_to_slack.png"
              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
            />
          </a>
          <CustomizableButton
            variant="contained"
            text="Configure"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 2,
            }}
            icon={<SliderIcon />}
            onClick={handleOpenOrClose}
          />
        </Box>
      </Stack>
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
      <PopupRender />
    </Box>
  );
};

export default SlackIntegrations;
