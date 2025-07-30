import { Stack, Typography, useTheme, Box, Paper } from "@mui/material";
import { useState, useEffect } from "react";
import { getAllLogs } from "../../../../application/repository/logs.repository";
import LogLine from "../../../components/LogLine";
import Placeholder from "../../../assets/imgs/empty-state.svg";

const WatchTowerLogs = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logsInfo, setLogsInfo] = useState<string>("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getAllLogs({ routeUrl: "/logger/logs" });
        const logsData = response.data;

        if (logsData?.success && logsData?.data) {
          setLogs(logsData.data);
          setLogsInfo(logsData.message);
        } else if (logsData?.success === false) {
          setError(logsData.message || "No logs available for today");
          setLogs([]);
        } else {
          setError("Failed to load logs. Please try again later.");
          setLogs([]);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError("Failed to load logs. Please try again later.");
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (isLoading) {
    return (
      <Stack className="watch-tower-logs" spacing={theme.spacing(4)}>
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
          <Typography>Loading logs...</Typography>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack className="watch-tower-logs" spacing={theme.spacing(4)}>
      {error && (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.error.main,
            backgroundColor: theme.palette.error.light,
            padding: theme.spacing(2),
            borderRadius: theme.shape.borderRadius,
          }}
        >
          {error}
        </Typography>
      )}

      {logs.length > 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.border.light}`,
            borderRadius: theme.shape.borderRadius,
            backgroundColor: theme.palette.background.main,
            overflow: "hidden",
          }}
        >
          {/* Log File Header */}
          <Box
            sx={{
              backgroundColor: theme.palette.grey[50],
              borderBottom: `1px solid ${theme.palette.border.light}`,
              padding: theme.spacing(3, 4),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  marginBottom: theme.spacing(0.5),
                }}
              >
                Application Logs
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "13px",
                  color: theme.palette.text.secondary,
                }}
              >
                {logsInfo || "Real-time application log entries"}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(2),
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: "12px",
                  color: theme.palette.text.secondary,
                  backgroundColor: theme.palette.grey[100],
                  padding: theme.spacing(0.5, 1.5),
                  borderRadius: theme.shape.borderRadius,
                  fontWeight: 500,
                }}
              >
                {logs.length} lines
              </Typography>
            </Box>
          </Box>

          {/* Log Content */}
          <Box
            sx={{
              maxHeight: "50vh",
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: theme.palette.grey[100],
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme.palette.grey[300],
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: theme.palette.grey[400],
                },
              },
            }}
          >
            {logs.map((line, index) => (
              <LogLine key={index} line={line} index={index} />
            ))}
          </Box>
        </Paper>
      ) : !error ? (
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
            There are currently no logs available.
          </Typography>
        </Stack>
      ) : null}
    </Stack>
  );
};

export default WatchTowerLogs;
