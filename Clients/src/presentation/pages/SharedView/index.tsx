import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Download, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { ENV_VARs } from "../../../../env.vars";

/**
 * SharedView page component for displaying publicly shared data
 * Accessed via /shared/:resourceType/:token
 */
const SharedView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    fetchSharedData();
  }, [token]);

  const fetchSharedData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${ENV_VARs.URL}/api/shares/view/${token}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load shared data");
      }

      setShareData(result.data);
    } catch (err) {
      setError((err as Error).message || "Failed to load shared data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!shareData?.permissions?.allowDataExport) {
      return;
    }

    // Convert data to CSV
    const data = shareData.data;
    if (!data) return;

    const headers = Object.keys(data);
    const values = Object.values(data);

    const csv = [
      headers.join(","),
      values.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shared-${shareData.share_link.resource_type}-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={48} sx={{ color: "#13715B", mb: 2 }} />
          <Typography variant="body1" color="textSecondary">
            Loading shared view...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
          p: 3,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 600 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body2" color="textSecondary">
            This link may have expired or been revoked. Please contact the person who shared this link with you.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!shareData) {
    return null;
  }

  const { share_link, data, permissions } = shareData;
  const isTableView = Array.isArray(data);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5", py: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: "#13715B", mb: 1 }}>
                Shared {share_link.resource_type.charAt(0).toUpperCase() + share_link.resource_type.slice(1)} {isTableView ? "List" : "View"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This {isTableView ? "list" : "view"} has been shared with you. {!permissions.allowDataExport && "Export is disabled by the owner."}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {permissions.allowDataExport && (
                <Tooltip title="Export data">
                  <IconButton
                    onClick={handleExport}
                    sx={{
                      color: "#13715B",
                      border: "1px solid #13715B",
                      "&:hover": {
                        backgroundColor: "rgba(19, 113, 91, 0.1)",
                      },
                    }}
                  >
                    <Download size={20} />
                  </IconButton>
                </Tooltip>
              )}
              {permissions.allowViewersToOpenRecords && data.id && (
                <Tooltip title="Open full record">
                  <IconButton
                    onClick={() => {
                      // This would navigate to the full record if implemented
                      console.log("Navigate to full record:", data.id);
                    }}
                    sx={{
                      color: "#13715B",
                      border: "1px solid #13715B",
                      "&:hover": {
                        backgroundColor: "rgba(19, 113, 91, 0.1)",
                      },
                    }}
                  >
                    <ExternalLinkIcon size={20} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Data Display */}
        <Paper sx={{ overflow: "hidden" }}>
          {permissions.displayToolbar && (
            <Toolbar
              sx={{
                backgroundColor: "#fafafa",
                borderBottom: "1px solid #e0e0e0",
                minHeight: "48px !important",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {share_link.resource_type.charAt(0).toUpperCase() + share_link.resource_type.slice(1)} {isTableView ? "List" : "Details"}
              </Typography>
            </Toolbar>
          )}
          <TableContainer>
            <Table>
              {isTableView ? (
                <>
                  {/* Table View: Display rows of data */}
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      {data.length > 0 && Object.keys(data[0]).map((key) => (
                        <TableCell key={key} sx={{ fontWeight: 600 }}>
                          {key
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((row: any, index: number) => (
                      <TableRow key={row.id || index} hover>
                        {Object.values(row).map((value: any, colIndex: number) => (
                          <TableCell key={colIndex}>
                            {value === null || value === undefined ? (
                              <Typography variant="body2" color="textSecondary" fontStyle="italic">
                                N/A
                              </Typography>
                            ) : typeof value === "object" ? (
                              <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                                {JSON.stringify(value, null, 2)}
                              </Typography>
                            ) : typeof value === "boolean" ? (
                              <Typography variant="body2">
                                {value ? "Yes" : "No"}
                              </Typography>
                            ) : (
                              <Typography variant="body2">{String(value)}</Typography>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : (
                <>
                  {/* Single Record View: Display key-value pairs */}
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 600, width: "30%" }}>
                        Field
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data).map(([key, value]) => (
                      <TableRow key={key} hover>
                        <TableCell sx={{ fontWeight: 500, color: "#666" }}>
                          {key
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </TableCell>
                        <TableCell>
                          {value === null || value === undefined ? (
                            <Typography variant="body2" color="textSecondary" fontStyle="italic">
                              N/A
                            </Typography>
                          ) : typeof value === "object" ? (
                            <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace", fontSize: 12 }}>
                              {JSON.stringify(value, null, 2)}
                            </Typography>
                          ) : typeof value === "boolean" ? (
                            <Typography variant="body2">
                              {value ? "Yes" : "No"}
                            </Typography>
                          ) : (
                            <Typography variant="body2">{String(value)}</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
            </Table>
          </TableContainer>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="caption" color="textSecondary">
            Powered by VerifyWise
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SharedView;
