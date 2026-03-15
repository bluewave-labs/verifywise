import { useState, useEffect, useCallback, useRef } from "react";
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
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  ChevronsUpDown,
  KeyRound,
} from "lucide-react";
import { Tooltip as MuiTooltip } from "@mui/material";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import TablePaginationActions from "../../../components/TablePagination";
import SearchBox from "../../../components/Search/SearchBox";
import Chip from "../../../components/Chip";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { sectionTitleSx, useCardSx } from "../shared";

const ROWS_PER_PAGE_KEY = "vw_ai_gateway_logs_rows_per_page";
const AUTO_REFRESH_INTERVAL_MS = 10_000;

type StatusFilter = "all" | "success" | "error";
type SourceFilter = "all" | "playground" | "virtual-key";

interface RequestMessage {
  role: string;
  content: string;
}

function isMessageArray(value: unknown): value is RequestMessage[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof (value[0] as Record<string, unknown>).role === "string" &&
    typeof (value[0] as Record<string, unknown>).content === "string"
  );
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === todayStr) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDayKey(dateStr: string): string {
  return new Date(dateStr).toDateString();
}

const roleLabelColor: Record<string, string> = {
  system: palette.text.disabled,
  user: palette.brand?.primary ?? "#13715B",
  assistant: palette.text.secondary,
};

function ConversationView({ messages }: { messages: RequestMessage[] }) {
  return (
    <Stack gap="10px">
      {messages.map((msg, i) => (
        <Box key={i}>
          <Typography
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: roleLabelColor[msg.role] ?? palette.text.secondary,
              textTransform: "capitalize",
              display: "block",
              mb: "4px",
            }}
          >
            {msg.role}
          </Typography>
          <Box
            sx={{
              fontFamily: "monospace",
              fontSize: 11,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: palette.text.primary,
              lineHeight: 1.6,
            }}
          >
            {msg.content}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Stack direction="row" gap="0px">
      {options.map((opt, i) => {
        const isActive = opt.value === value;
        const isFirst = i === 0;
        const isLast = i === options.length - 1;
        return (
          <Box
            key={opt.value}
            component="button"
            onClick={() => onChange(opt.value)}
            sx={{
              background: "none",
              border: `1px solid ${palette.border.light}`,
              borderLeft: isFirst ? `1px solid ${palette.border.light}` : "none",
              borderRadius: isFirst ? "4px 0 0 4px" : isLast ? "0 4px 4px 0" : "0",
              cursor: "pointer",
              px: "12px",
              height: "34px",
              fontSize: 13,
              fontFamily: "inherit",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? palette.brand?.primary ?? "#13715B" : palette.text.secondary,
              borderBottom: isActive
                ? `2px solid ${palette.brand?.primary ?? "#13715B"}`
                : `1px solid ${palette.border.light}`,
              transition: "color 0.15s, border-bottom 0.15s",
              "&:hover": {
                color: palette.brand?.primary ?? "#13715B",
                backgroundColor: palette.background.hover,
              },
            }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Stack>
  );
}

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Success", value: "success" },
  { label: "Error", value: "error" },
];

const SOURCE_OPTIONS: { label: string; value: SourceFilter }[] = [
  { label: "All", value: "all" },
  { label: "Playground", value: "playground" },
  { label: "Virtual key", value: "virtual-key" },
];

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

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildQuery = useCallback(
    (p: number, rpp: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(rpp));
      params.set("offset", String(p * rpp));
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      return params.toString();
    },
    [search, statusFilter, sourceFilter]
  );

  const loadLogs = useCallback(
    async (p: number, rpp: number) => {
      setLoading(true);
      try {
        const qs = buildQuery(p, rpp);
        const res = await apiServices.get(`/ai-gateway/spend/logs?${qs}`);
        const data = res?.data?.data || {};
        setLogs(data.rows || []);
        setTotal(data.total || 0);
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    },
    [buildQuery]
  );

  // Reload when filters or pagination change
  useEffect(() => {
    setPage(0);
    setExpandedId(null);
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    loadLogs(page, rowsPerPage);
  }, [page, rowsPerPage, loadLogs]);

  // Auto-refresh interval management
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadLogs(page, rowsPerPage);
      }, AUTO_REFRESH_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, page, rowsPerPage, loadLogs]);

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

  // Group logs by calendar day
  const groupedLogs = (() => {
    const seenDays = new Set<string>();
    return logs.map((log) => {
      const dayKey = getDayKey(log.created_at);
      const isFirstOfDay = !seenDays.has(dayKey);
      if (isFirstOfDay) seenDays.add(dayKey);
      return { log, isFirstOfDay, dayKey };
    });
  })();

  const hasLogs = logs.length > 0 || (total > 0 && loading);

  return (
    <PageHeaderExtended
      title="Logs"
      description="View request and response logs for all AI Gateway traffic."
      tipBoxEntity="ai-gateway-analytics"
      helpArticlePath="ai-gateway/analytics"
      actionButton={
        <Stack direction="row" gap="8px" alignItems="center">
          <Box
            component="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            sx={{
              background: "none",
              border: `1px solid ${palette.border.light}`,
              borderRadius: "4px",
              cursor: "pointer",
              height: "34px",
              px: "12px",
              fontSize: 12,
              fontFamily: "inherit",
              fontWeight: autoRefresh ? 600 : 400,
              color: autoRefresh ? (palette.brand?.primary ?? "#13715B") : palette.text.secondary,
              transition: "color 0.15s",
              "&:hover": {
                color: palette.brand?.primary ?? "#13715B",
                backgroundColor: palette.background.hover,
              },
            }}
          >
            Auto
          </Box>
          <CustomizableButton
            text={loading ? "Loading..." : "Refresh"}
            icon={<RefreshCw size={14} strokeWidth={1.5} />}
            onClick={() => loadLogs(page, rowsPerPage)}
          />
        </Stack>
      }
    >
      {/* Filter bar */}
      <Box
        sx={{
          mb: "16px",
          p: "12px 16px",
          background: theme.palette.background.paper,
          border: `1.5px solid ${theme.palette.border.light}`,
          borderRadius: theme.shape.borderRadius,
        }}
      >
        <Stack direction="row" gap="12px" alignItems="center" flexWrap="wrap">
          <Box sx={{ flex: "1 1 200px", minWidth: 180, maxWidth: 320 }}>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search endpoints, models, users..."
              fullWidth={false}
              sx={{ width: "100%" }}
            />
          </Box>
          <Stack direction="row" gap="8px" alignItems="center" flexWrap="wrap">
            <Typography sx={{ fontSize: 12, color: palette.text.disabled, mr: "2px" }}>
              Status
            </Typography>
            <ToggleGroup
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
            />
          </Stack>
          <Stack direction="row" gap="8px" alignItems="center" flexWrap="wrap">
            <Typography sx={{ fontSize: 12, color: palette.text.disabled, mr: "2px" }}>
              Source
            </Typography>
            <ToggleGroup
              options={SOURCE_OPTIONS}
              value={sourceFilter}
              onChange={(v) => setSourceFilter(v)}
            />
          </Stack>
        </Stack>
      </Box>

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

      {hasLogs && (
        <Box sx={cardSx}>
          <Stack gap="12px">
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography sx={sectionTitleSx}>Recent requests</Typography>
              <MuiTooltip
                title="Click a row to expand and see full request/response details"
                arrow
                placement="top"
              >
                <Box sx={{ display: "flex", cursor: "help" }}>
                  <Info size={14} color={palette.text.disabled} />
                </Box>
              </MuiTooltip>
              <Box sx={{ flex: 1 }} />
              <Typography sx={{ fontSize: 11, color: palette.text.disabled }}>
                {total.toLocaleString()} total
              </Typography>
            </Stack>

            <Stack gap="4px">
              {groupedLogs.map(({ log, isFirstOfDay }) => (
                <Box key={log.id}>
                  {/* Date group header */}
                  {isFirstOfDay && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: palette.text.disabled,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        mt: "8px",
                        mb: "6px",
                        pb: "4px",
                        borderBottom: `1px solid ${palette.border.light}`,
                      }}
                    >
                      {formatDateHeader(log.created_at)}
                    </Typography>
                  )}

                  {/* Log row */}
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
                      {/* Virtual key name or user name */}
                      {log.virtual_key_id ? (
                        <Stack direction="row" alignItems="center" gap="4px">
                          <KeyRound size={12} color={palette.text.disabled} strokeWidth={1.5} />
                          <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                            {log.virtual_key_name || log.virtual_key_prefix || "Virtual key"}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                          {log.user_name}
                        </Typography>
                      )}

                      <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                        {Number(log.total_tokens).toLocaleString()} tokens
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, minWidth: 70, textAlign: "right" }}>
                        ${Number(log.cost_usd).toFixed(6)}
                      </Typography>

                      {/* Status chip */}
                      <Chip
                        label={String(log.status_code)}
                        variant={log.status_code === 200 ? "success" : "error"}
                        size="small"
                        uppercase={false}
                      />

                      <Typography sx={{ fontSize: 10, color: palette.text.disabled, minWidth: 65 }}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Expanded detail panel */}
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
                        <Box
                          sx={{
                            mb: 1.5,
                            p: "16px",
                            borderRadius: "4px",
                            backgroundColor: palette.background.main,
                            border: `1px solid ${palette.border.light}`,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: palette.text.tertiary,
                              mb: 1.5,
                            }}
                          >
                            Request
                          </Typography>
                          {isMessageArray(log.request_messages) ? (
                            <ConversationView messages={log.request_messages} />
                          ) : (
                            <Box
                              sx={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all",
                                maxHeight: 200,
                                overflow: "auto",
                              }}
                            >
                              {JSON.stringify(log.request_messages, null, 2)}
                            </Box>
                          )}
                        </Box>
                      )}

                      {log.response_text && (
                        <Box
                          sx={{
                            mb: 1.5,
                            p: "16px",
                            borderRadius: "4px",
                            backgroundColor: palette.background.main,
                            border: `1px solid ${palette.border.light}`,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: palette.text.tertiary,
                              mb: 1,
                            }}
                          >
                            Response
                          </Typography>
                          <Box sx={{ fontSize: 12, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
                            {log.response_text}
                          </Box>
                        </Box>
                      )}

                      {log.error_message && (
                        <Box
                          sx={{
                            mb: 1.5,
                            p: "16px",
                            borderRadius: "4px",
                            backgroundColor: palette.background.main,
                            border: `1px solid ${palette.border.light}`,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: palette.status.error.text,
                              mb: 1,
                            }}
                          >
                            Error
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
                            {log.error_message}
                          </Typography>
                        </Box>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <Box
                          sx={{
                            mb: 1,
                            p: "16px",
                            borderRadius: "4px",
                            backgroundColor: palette.background.main,
                            border: `1px solid ${palette.border.light}`,
                          }}
                        >
                          <Typography
                            sx={{ fontSize: 11, fontWeight: 600, color: palette.text.tertiary, mb: 1 }}
                          >
                            Metadata
                          </Typography>
                          <Typography sx={{ fontSize: 11, fontFamily: "monospace" }}>
                            {JSON.stringify(log.metadata)}
                          </Typography>
                        </Box>
                      )}

                      <Stack
                        direction="row"
                        gap="16px"
                        sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${palette.border.light}` }}
                      >
                        <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                          Latency: <strong>{log.latency_ms}ms</strong>
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                          Prompt: <strong>{Number(log.prompt_tokens).toLocaleString()} tokens</strong>
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                          Completion:{" "}
                          <strong>{Number(log.completion_tokens).toLocaleString()} tokens</strong>
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>

          {/* Pagination */}
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
