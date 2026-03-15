import { useState, useEffect, useRef } from "react";
import { Box, Typography, Stack, IconButton, Slider } from "@mui/material";
import { Settings, Router } from "lucide-react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ThreadPrimitive } from "@assistant-ui/react";
import Select from "../../../components/Inputs/Select";
import Field from "../../../components/Inputs/Field";
import StandardModal from "../../../components/Modals/StandardModal";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { usePlaygroundRuntime } from "./usePlaygroundRuntime";
import { PlaygroundMessage } from "./PlaygroundMessage";
import { PlaygroundComposer } from "./PlaygroundComposer";

export default function PlaygroundPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState(() =>
    localStorage.getItem("vw_playground_endpoint") || ""
  );
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem("vw_playground_temperature");
    return saved ? Number(saved) : 0.7;
  });
  const [maxTokens, setMaxTokens] = useState(() => {
    const saved = localStorage.getItem("vw_playground_max_tokens");
    return saved ? Number(saved) : 4096;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [tempTemperature, setTempTemperature] = useState(0.7);
  const [tempMaxTokens, setTempMaxTokens] = useState(4096);

  const configRef = useRef({ endpointSlug: "", temperature: 0.7, maxTokens: 4096 });

  // Keep configRef in sync
  configRef.current = {
    endpointSlug: selectedEndpoint,
    temperature,
    maxTokens,
  };

  const runtime = usePlaygroundRuntime(configRef);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiServices.get("/ai-gateway/endpoints");
        const eps = (res?.data?.data || []).filter((e: any) => e.is_active);
        setEndpoints(eps);
        if (eps.length > 0) {
          setSelectedEndpoint((prev) => prev || eps[0].slug);
        }
      } catch {
        // Silently handle
      }
    };
    load();
  }, []);

  const endpointItems = endpoints.map((ep) => ({
    _id: ep.slug,
    name: ep.display_name,
  }));

  return (
    <PageHeaderExtended
      title="Playground"
      description="Test your configured endpoints with an interactive chat interface."
      tipBoxEntity="ai-gateway-playground"
      helpArticlePath="ai-gateway/playground"
    >
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 280px)" }}>
        {/* Controls */}
        <Stack direction="row" gap="8px" mb={2} alignItems="center">
          <Box sx={{ minWidth: 320, maxWidth: 420 }}>
            <Select
              id="endpoint"
              placeholder="Select endpoint"
              value={selectedEndpoint}
              items={endpointItems}
              onChange={(e) => {
                const val = e.target.value as string;
                setSelectedEndpoint(val);
                localStorage.setItem("vw_playground_endpoint", val);
              }}
              getOptionValue={(item) => item._id}
            />
          </Box>
          <Box sx={{ flex: 1 }} />
          <IconButton
            onClick={() => {
              setTempTemperature(temperature);
              setTempMaxTokens(maxTokens);
              setShowSettings(true);
            }}
            sx={{
              p: 1,
              backgroundColor: showSettings ? palette.background.fill : "transparent",
              borderRadius: "4px",
              "&:hover": { backgroundColor: palette.background.fill },
            }}
          >
            <Settings size={16} strokeWidth={1.5} color={showSettings ? palette.brand.primary : palette.text.tertiary} />
          </IconButton>
        </Stack>

        {/* Settings Modal */}
        <StandardModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Playground settings"
          description="Configure parameters for your requests"
          onSubmit={() => {
            setTemperature(tempTemperature);
            setMaxTokens(tempMaxTokens);
            localStorage.setItem("vw_playground_temperature", String(tempTemperature));
            localStorage.setItem("vw_playground_max_tokens", String(tempMaxTokens));
            setShowSettings(false);
          }}
          submitButtonText="Save"
          fitContent
          maxWidth="400px"
        >
          <Stack gap="16px">
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>
                Temperature: {tempTemperature}
              </Typography>
              <Slider
                value={tempTemperature}
                onChange={(_, v) => setTempTemperature(v as number)}
                min={0}
                max={2}
                step={0.1}
                size="small"
                sx={{ color: palette.brand.primary }}
              />
              <Typography sx={{ fontSize: 11, color: palette.text.tertiary }}>
                Lower values are more focused, higher values are more creative
              </Typography>
            </Box>
            <Field
              label="Max tokens"
              placeholder="4096"
              value={String(tempMaxTokens)}
              onChange={(e) => setTempMaxTokens(Number(e.target.value) || 4096)}
            />
          </Stack>
        </StandardModal>

        {/* Chat Area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 400,
            border: `1.5px solid ${palette.border.light}`,
            borderRadius: "4px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: palette.background.alt,
          }}
        >
          {!selectedEndpoint ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: "100%", minHeight: 280 }}
            >
              <Router size={32} color={palette.text.disabled} strokeWidth={1.5} />
              <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 1 }}>
                Select an endpoint to start testing
              </Typography>
            </Stack>
          ) : (
            <AssistantRuntimeProvider runtime={runtime}>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <ThreadPrimitive.Root
                  style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
                >
                  <ThreadPrimitive.Viewport
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "16px",
                    }}
                  >
                    <ThreadPrimitive.Messages
                      components={{ UserMessage: PlaygroundMessage, AssistantMessage: PlaygroundMessage }}
                    />
                  </ThreadPrimitive.Viewport>
                  <PlaygroundComposer disabled={!selectedEndpoint} />
                </ThreadPrimitive.Root>
              </Box>
            </AssistantRuntimeProvider>
          )}
        </Box>
      </Box>
    </PageHeaderExtended>
  );
}
