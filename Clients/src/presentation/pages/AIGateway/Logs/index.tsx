import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Table,
  TableBody,
  TableRow,
  TablePagination,
  useTheme,
} from "@mui/material";
import { FileText, ChevronDown, ChevronUp, Info, RefreshCw, ChevronsUpDown } from "lucide-react";
import { Tooltip as MuiTooltip } from "@mui/material";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import TablePaginationActions from "../../../components/TablePagination";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { sectionTitleSx, useCardSx } from "../shared";

const ROWS_PER_PAGE_KEY = "vw_ai_gateway_logs_rows_per_page";

export default function LogsPage() {
  const theme = useTheme();
  const cardSx = useCardSx();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem(ROWS_PER_PAGE_KEY);
    return saved ? Number(saved) : 25;
  });

  const loadLogs = useCallback(async (p: number, rpp: number) => {
    setLoading(true);
    try {
      const res = await apiServices.get(`/ai-gateway/spend/logs?limit=${rpp}&offset=${p * rpp}`);
      const data = res?.data?.data || {};
      setLogs(data.rows || []);
      setTotal(data.total || 0);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs(page, rowsPerPage);
  }, [page, rowsPerPage, loadLogs]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    setExpandedId(null);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rpp = parseInt(e.target.value, 10);
    setRowsPerPage(rpp);
    setPage(0);
    localStorage.setItem(ROWS_PER_PAGE_KEY, String(rpp));
  };

  return (
    <PageHeaderExtended
      title="Logs"
      description="View request and response logs for all AI Gateway traffic."
      tipBoxEntity="ai-gateway-analytics"
      helpArticlePath="ai-gateway/analytics"
      actionButton={
        <CustomizableButton
          text={loading ? "Loading..." : "Refresh"}
          icon={<RefreshCw size={14} strokeWidth={1.5} />}
          onClick={() => loadLogs(page, rowsPerPage)}
        />
      }
    >
      {!loading && logs.length === 0 && total === 0 && (
        <EmptyState
          icon={FileText}
          message="No request logs yet. Send requests through the gateway to see detailed logs here."
          showBorder
        >
          <EmptyStateTip
            icon={FileText}
            title="Full request and response audit"
            description="Each log entry shows the complete prompt sent to the LLM, the model's response, cost, tokens, latency, and any metadata tags attached to the request."
          />
        </EmptyState>
      )}

      {(logs.length > 0 || (total > 0 && loading)) && (
        <Box sx={cardSx}>
          <Stack gap="12px">
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography sx={sectionTitleSx}>Recent requests</Typography>
              <MuiTooltip title="Click a row to expand and see full request/response details" arrow placement="top">
                <Box sx={{ display: "flex", cursor: "help" }}><Info size={14} color={palette.text.disabled} /></Box>
              </MuiTooltip>
              <Box sx={{ flex: 1 }} />
              <Typography sx={{ fontSize: 11, color: palette.text.disabled }}>
                {total.toLocaleString()} total
              </Typography>
            </Stack>

            <Stack gap="4px">
              {logs.map((log: any) => (
                <Box key={log.id}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    sx={{
                      p: "10px 14px",
                      borderRadius: "4px",
                      border: `1px solid ${palette.border.light}`,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: palette.background.hover },
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap="8px">
                      {expandedId === log.id ? (
                        <ChevronUp size={14} color={palette.text.tertiary} />
                      ) : (
                        <ChevronDown size={14} color={palette.text.tertiary} />
                      )}
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                        {log.endpoint_name || log.endpoint_slug || "unknown"}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                        {log.model}
                      </Typography>
                    </Stack>
                    <Stack direction="row" gap="12px" alignItems="center">
                      <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                        {log.user_name}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                        {Number(log.total_tokens).toLocaleString()} tokens
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, minWidth: 70, textAlign: "right" }}>
                        ${Number(log.cost_usd).toFixed(6)}
                      </Typography>
                      <Typography sx={{
                        fontSize: 11,
                        color: log.status_code === 200 ? palette.status.success.text : palette.status.error.text,
                        fontWeight: 500,
                      }}>
                        {log.status_code}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: palette.text.disabled, minWidth: 65 }}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </Typography>
                    </Stack>
                  </Stack>

                  {expandedId === log.id && (
                    <Box
                      sx={{
                        p: "12px 16px",
                        ml: 3,
                        mt: 0.5,
                        border: `1px solid ${palette.border.light}`,
                        borderRadius: "4px",
                        backgroundColor: palette.background.alt,
                      }}
                    >
                      {log.request_messages && (
                        <Box sx={{
                          mb: 1.5, p: "16px", borderRadius: "4px",
                          backgroundColor: palette.background.main, border: `1px solid ${palette.border.light}`,
                        }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.text.tertiary, mb: 1 }}>
                            Request
                          </Typography>
                          <Box sx={{
                            fontFamily: "monospace", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all",
                            maxHeight: 200, overflow: "auto",
                          }}>
                            {JSON.stringify(log.request_messages, null, 2)}
                          </Box>
                        </Box>
                      )}
                      {log.response_text && (
                        <Box sx={{
                          mb: 1.5, p: "16px", borderRadius: "4px",
                          backgroundColor: palette.background.main, border: `1px solid ${palette.border.light}`,
                        }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.text.tertiary, mb: 1 }}>
                            Response
                          </Typography>
                          <Box sx={{
                            fontSize: 12, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto",
                          }}>
                            {log.response_text}
                          </Box>
                        </Box>
                      )}
                      {log.error_message && (
                        <Box sx={{
                          mb: 1.5, p: "16px", borderRadius: "4px",
                          backgroundColor: palette.background.main, border: `1px solid ${palette.border.light}`,
                        }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.status.error.text, mb: 1 }}>Error</Typography>
                          <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>{log.error_message}</Typography>
                        </Box>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <Box sx={{
                          mb: 1, p: "16px", borderRadius: "4px",
                          backgroundColor: palette.background.main, border: `1px solid ${palette.border.light}`,
                        }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.text.tertiary, mb: 1 }}>Metadata</Typography>
                          <Typography sx={{ fontSize: 11, fontFamily: "monospace" }}>{JSON.stringify(log.metadata)}</Typography>
                        </Box>
                      )}
                      <Stack direction="row" gap="16px" sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${palette.border.light}` }}>
                        <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                          Latency: <strong>{log.latency_ms}ms</strong>
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                          Prompt: <strong>{Number(log.prompt_tokens).toLocaleString()} tokens</strong>
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                          Completion: <strong>{Number(log.completion_tokens).toLocaleString()} tokens</strong>
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>

          {/* Pagination — matches VerifyWise standard table pattern */}
          <Table>
            <TableBody>
              <TableRow>
                <TablePagination
                  count={total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[10, 25, 50]}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
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
                          sx: { mt: 0, mb: theme.spacing(2) },
                        },
                        transformOrigin: { vertical: "bottom", horizontal: "left" },
                        anchorOrigin: { vertical: "top", horizontal: "left" },
                        sx: { mt: theme.spacing(-2) },
                      },
                      inputProps: { id: "pagination-dropdown" },
                      IconComponent: () => <ChevronsUpDown size={16} />,
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
                    backgroundColor: theme.palette.grey[50],
                    border: `1px solid ${theme.palette.border.light}`,
                    borderTop: "none",
                    borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
                    color: theme.palette.text.secondary,
                    height: "50px",
                    minHeight: "50px",
                    "& .MuiTablePagination-toolbar": {
                      minHeight: "50px",
                      paddingTop: "4px",
                      paddingBottom: "4px",
                    },
                    "& .MuiSelect-icon": {
                      width: "24px",
                      height: "fit-content",
                    },
                    "& .MuiSelect-select": {
                      width: theme.spacing(10),
                      borderRadius: theme.shape.borderRadius,
                      border: `1px solid ${theme.palette.border.light}`,
                    },
                  }}
                />
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      )}
    </PageHeaderExtended>
  );
}
