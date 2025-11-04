import { useState, useEffect, lazy, Suspense } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Checkbox,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import { Save, Play } from "lucide-react";
const Field = lazy(() => import("../../components/Inputs/Field"));
import Alert from "../../components/Alert";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";

interface ProjectConfigurationProps {
  projectId: string;
  project: any;
  onProjectUpdate: (project: any) => void;
}

export default function ProjectConfiguration({
  projectId,
  project,
  onProjectUpdate,
}: ProjectConfigurationProps) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<any>(null);

  useEffect(() => {
    if (project) {
      setConfig(project);
    }
  }, [project]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await deepEvalProjectsService.updateProject(projectId, config);
      onProjectUpdate(response.project);
      setAlert({ variant: "success", body: "Configuration saved successfully" });
      setTimeout(() => setAlert(null), 3000);
    } catch (err: any) {
      setAlert({ variant: "error", body: "Failed to save configuration" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      <Typography variant="h5" gutterBottom>
        Project Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Configure model settings, dataset, and evaluation metrics for this project
      </Typography>

      <Stack spacing={4}>
        {/* Project Info */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Information
            </Typography>

            <Stack spacing={3}>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  label="Project Name"
                  value={config.name || ""}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                />
              </Suspense>

              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  label="Description"
                  value={config.description || ""}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                />
              </Suspense>
            </Stack>
          </CardContent>
        </Card>

        {/* Model Configuration */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Model Configuration
            </Typography>

            <Stack spacing={3}>
              <Suspense fallback={<div>Loading...</div>}>
                <Field
                  label="Model Name"
                  value={config.model?.name || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      model: { ...config.model, name: e.target.value },
                    })
                  }
                />
              </Suspense>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>Provider</Typography>
                <Select
                  value={config.model?.provider || "huggingface"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      model: { ...config.model, provider: e.target.value },
                    })
                  }
                  fullWidth
                >
                  <MenuItem value="huggingface">HuggingFace</MenuItem>
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="ollama">Ollama</MenuItem>
                </Select>
              </Box>

              <Box display="flex" gap={2}>
                <TextField
                  label="Max Tokens"
                  type="number"
                  value={config.model?.generation?.maxTokens || 500}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      model: {
                        ...config.model,
                        generation: {
                          ...config.model.generation,
                          maxTokens: parseInt(e.target.value),
                        },
                      },
                    })
                  }
                  fullWidth
                />
                <TextField
                  label="Temperature"
                  type="number"
                  value={config.model?.generation?.temperature || 0.7}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      model: {
                        ...config.model,
                        generation: {
                          ...config.model.generation,
                          temperature: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  inputProps={{ step: 0.1 }}
                  fullWidth
                />
                <TextField
                  label="Top P"
                  type="number"
                  value={config.model?.generation?.topP || 0.9}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      model: {
                        ...config.model,
                        generation: {
                          ...config.model.generation,
                          topP: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  inputProps={{ step: 0.1 }}
                  fullWidth
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Metrics Configuration */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              DeepEval Metrics (LLM-as-a-Judge)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which metrics to evaluate (uses GPT-4 as judge)
            </Typography>

            <Stack spacing={1}>
              {config.metrics && Object.entries(config.metrics).map(([key, value]: [string, any]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={value}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          metrics: { ...config.metrics, [key]: e.target.checked },
                        })
                      }
                    />
                  }
                  label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Save size={20} />}
            onClick={handleSave}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Save Configuration
          </Button>
          <Button
            variant="contained"
            startIcon={<Play size={20} />}
            onClick={handleSave}
            disabled={loading}
            sx={{
              textTransform: "none",
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "#0f5a47" },
            }}
          >
            Save & Run Experiment
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

