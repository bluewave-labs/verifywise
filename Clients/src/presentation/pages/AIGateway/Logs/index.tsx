import { useState } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { FileText, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Tooltip as MuiTooltip } from "@mui/material";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { sectionTitleSx, useCardSx } from "../shared";

export default function LogsPage() {
  const cardSx = useCardSx();
  const [logs, setLogs] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiServices.get("/ai-gateway/spend/logs?limit=50");
      setLogs(res?.data?.data || []);
      setLoaded(true);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageHeaderExtended
      title="Logs"
      description="View request and response logs for all AI Gateway traffic."
      tipBoxEntity="ai-gateway-analytics"
      helpArticlePath="ai-gateway/analytics"
      actionButton={
        <CustomizableButton
          text={loading ? "Loading..." : logs.length > 0 ? "Refresh" : "Load logs"}
          icon={<FileText size={14} strokeWidth={1.5} />}
          onClick={loadLogs}
        />
      }
    >
      {loaded && logs.length === 0 && (
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

      {logs.length > 0 && (
        <Box sx={cardSx}>
          <Stack gap="12px">
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography sx={sectionTitleSx}>Recent requests</Typography>
              <MuiTooltip title="Click a row to expand and see full request/response details" arrow placement="top">
                <Box sx={{ display: "flex", cursor: "help" }}><Info size={14} color={palette.text.disabled} /></Box>
              </MuiTooltip>
              <Box sx={{ flex: 1 }} />
              <Typography sx={{ fontSize: 11, color: palette.text.disabled }}>
                {logs.length} entries
              </Typography>
            </Stack>

            <Stack gap="4px" sx={{ maxHeight: 600, overflowY: "auto" }}>
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
                      "&:hover": { backgroundColor: palette.background.fill },
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
                        <Box sx={{ mb: 1.5 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.text.tertiary, mb: 0.5 }}>
                            Request
                          </Typography>
                          <Box sx={{
                            fontFamily: "monospace", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all",
                            maxHeight: 200, overflow: "auto", p: 1, borderRadius: "4px",
                            backgroundColor: palette.background.main, border: `1px solid ${palette.border.light}`,
                          }}>
                            {JSON.stringify(log.request_messages, null, 2)}
                          </Box>
                        </Box>
                      )}
                      {log.response_text && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.text.tertiary, mb: 0.5 }}>
                            Response
                          </Typography>
                          <Box sx={{
                            fontSize: 12, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto", p: 1,
                            borderRadius: "4px", backgroundColor: palette.background.main, border: `1px solid ${palette.border.light}`,
                          }}>
                            {log.response_text}
                          </Box>
                        </Box>
                      )}
                      {log.error_message && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.status.error.text, mb: 0.5 }}>Error</Typography>
                          <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>{log.error_message}</Typography>
                        </Box>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: palette.text.tertiary, mb: 0.5 }}>Metadata</Typography>
                          <Typography sx={{ fontSize: 11, fontFamily: "monospace" }}>{JSON.stringify(log.metadata)}</Typography>
                        </Box>
                      )}
                      <Typography sx={{ fontSize: 10, color: palette.text.disabled, mt: 1 }}>
                        Latency: {log.latency_ms}ms &middot; Prompt: {log.prompt_tokens} tokens &middot; Completion: {log.completion_tokens} tokens
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>
        </Box>
      )}
    </PageHeaderExtended>
  );
}
