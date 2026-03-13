import { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { CirclePlus, Router } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiServices.get("/ai-gateway/endpoints");
        setEndpoints(response?.data?.data || []);
      } catch {
        // Silently handle — empty state will show
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: palette.text.primary }}>
            Endpoints
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 0.5 }}>
            Configure LLM provider endpoints for your organization
          </Typography>
        </Box>
        <CustomizableButton
          text="Add endpoint"
          icon={<CirclePlus size={14} strokeWidth={1.5} />}
        />
      </Stack>

      {loading ? (
        <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>
          Loading endpoints...
        </Typography>
      ) : endpoints.length === 0 ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            py: 8,
            border: `1px solid ${palette.border.dark}`,
            borderRadius: "4px",
            backgroundColor: palette.background.alt,
          }}
        >
          <Router size={32} color={palette.text.disabled} strokeWidth={1.5} />
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: palette.text.primary, mt: 2 }}>
            No endpoints configured
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mt: 0.5 }}>
            Add your first LLM endpoint to get started
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1}>
          {endpoints.map((ep) => (
            <Box
              key={ep.id}
              sx={{
                p: 2,
                border: `1px solid ${palette.border.dark}`,
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.primary }}>
                  {ep.display_name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                  {ep.provider} / {ep.model}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: 11,
                  color: ep.is_active ? palette.status.success.text : palette.text.disabled,
                  fontWeight: 500,
                }}
              >
                {ep.is_active ? "Active" : "Inactive"}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
