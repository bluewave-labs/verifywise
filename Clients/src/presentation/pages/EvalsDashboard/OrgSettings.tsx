import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import Field from "../../components/Inputs/Field";
import CustomizableButton from "../../components/Button/CustomizableButton";

export default function OrgSettings() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [keys, setKeys] = useState({
    openai: "",
    anthropic: "",
    google: "",
    xai: "",
    mistral: "",
    huggingface: "",
  });

  const breadcrumbs = [
    { label: "LLM Evals Dashboard", onClick: () => navigate("/evals") },
    { label: "Organization settings" },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: wire to backend org settings endpoint. For now, keep local-only.
      console.log("Saving org keys (redacted)", {
        ...keys,
        openai: keys.openai ? "***" : "",
      });
      alert("Saved organization settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2, userSelect: "none" }}>
        <PageBreadcrumbs items={breadcrumbs} />
        <PageHeader title="Organization settings" />
      </Box>

      <Stack spacing={3} sx={{ maxWidth: 560 }}>
        <Field
          label="OpenAI API key"
          value={keys.openai}
          onChange={(e) => setKeys((k) => ({ ...k, openai: e.target.value }))}
          placeholder="sk-..."
          type="password"
        />
        <Field
          label="Anthropic API key"
          value={keys.anthropic}
          onChange={(e) => setKeys((k) => ({ ...k, anthropic: e.target.value }))}
          placeholder="..."
          type="password"
        />
        <Field
          label="Google (Gemini) API key"
          value={keys.google}
          onChange={(e) => setKeys((k) => ({ ...k, google: e.target.value }))}
          placeholder="..."
          type="password"
        />
        <Field
          label="xAI API key"
          value={keys.xai}
          onChange={(e) => setKeys((k) => ({ ...k, xai: e.target.value }))}
          placeholder="..."
          type="password"
        />
        <Field
          label="Mistral API key"
          value={keys.mistral}
          onChange={(e) => setKeys((k) => ({ ...k, mistral: e.target.value }))}
          placeholder="..."
          type="password"
        />
        <Field
          label="Hugging Face token"
          value={keys.huggingface}
          onChange={(e) => setKeys((k) => ({ ...k, huggingface: e.target.value }))}
          placeholder="hf_..."
          type="password"
        />

        <Box>
          <CustomizableButton
            variant="contained"
            text="Save settings"
            isLoading={saving}
            onClick={handleSave}
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              "&:hover": { backgroundColor: "#0f5a47" },
              textTransform: "none",
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}

