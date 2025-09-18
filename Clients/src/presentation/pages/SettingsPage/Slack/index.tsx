import {
  Alert,
  Box,
  CircularProgress,
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
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../application/hooks/useAuth";
import { createSlackIntegration } from "../../../../application/repository/slack.integration.repository";
import useSlackIntegrations, {
  SlackWebhook,
} from "../../../../application/hooks/useSlackIntegrations";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import { singleTheme } from "../../../themes";
import { ReactComponent as SelectorVertical } from "../../../assets/icons/selector-vertical.svg";

const SlackIntegration = () => {
  const { userId } = useAuth();
  const {
    loading: loadingData,
    error: slackError,
    slackIntegrations,
    refreshSlackIntegrations,
  } = useSlackIntegrations(userId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [integrationData, setIntegrationData] = useState<SlackWebhook[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(0); // Current page
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page
  const theme = useTheme();

  useEffect(() => {
    if (slackIntegrations) {
      setIntegrationData(slackIntegrations);
    }
  }, [slackIntegrations, refreshSlackIntegrations]);

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
  ];

  const scopes = [
    "channels:read",
    "chat:write",
    "incoming-webhook",
    "chat:write.public",
    "groups:read",
    "users:read",
  ].join(",");

  const url = `${import.meta.env.VITE_SLACK_URL}?client_id=${
    import.meta.env.VITE_CLIENT_ID
  }&scope=${scopes}&user_scope=&redirect_uri=${
    window.location.origin
  }/setting/?activeTab=4`;

  // Handle the callback when user returns from Slack
  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setError(`Slack authorization failed: ${error}`);
      return;
    }

    if (code) {
      exchangeCodeForTokens(code);
    }
  }, []);

  const exchangeCodeForTokens = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // This should be done on your backend for security
      const body = { code, userId };
      await createSlackIntegration({ body });
      refreshSlackIntegrations();

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      setError("Failed to complete Slack integration");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || loadingData) {
    return (
      <Box sx={{ mt: 20, display: "flex", alignItems: "center", gap: 2 }}>
        <CircularProgress size={24} />
        <Typography>Connecting to Slack...</Typography>
      </Box>
    );
  }

  if (error || slackError) {
    return (
      <Box sx={{ mt: 20 }}>
        <Alert severity="error">
          {error ?? slackError ?? "Something went wrong!!!"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 20,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Connect your Slack workspace
      </Typography>
      {/* This is embeddable html provided by Slack */}
      <a href={`${url}`}>
        <img
          alt="Add to Slack"
          height="40"
          width="139"
          src="https://platform.slack-edge.com/img/add_to_slack.png"
          srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
        />
      </a>

      {integrationData.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 10 }}>
            Integrations
          </Typography>
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
                            singleTheme.tableStyles.primary.header
                              .backgroundColors,
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
                    .map((item) => (
                      <TableRow
                        key={item.id}
                        sx={singleTheme.tableStyles.primary.body.row}
                      >
                        <TableCell
                          sx={singleTheme.tableStyles.primary.body.cell}
                        >
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
                          {item.createdAt}
                        </TableCell>
                        <TableCell
                          sx={{
                            ...singleTheme.tableStyles.primary.body.cell,
                            textTransform: "none",
                          }}
                        >
                          {item.isActive ? "Yes" : "No"}
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
        </>
      )}
    </Box>
  );
};

export default SlackIntegration;
