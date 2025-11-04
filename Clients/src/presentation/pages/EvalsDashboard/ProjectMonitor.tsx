import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
} from "@mui/material";
import { Activity } from "lucide-react";

interface ProjectMonitorProps {
  projectId: string;
}

export default function ProjectMonitor({ projectId }: ProjectMonitorProps) {
  const [runningExperiments] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Load running experiments and poll for updates
  }, [projectId]);

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Activity size={24} color="#13715B" />
        <Typography variant="h5">Real-time Monitor</Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Evaluations
          </Typography>

          {runningExperiments.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography variant="body2" color="text.secondary">
                No active evaluations running
              </Typography>
            </Box>
          ) : (
            <Box>
              {runningExperiments.map((exp) => (
                <Box
                  key={exp.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {exp.id}
                    </Typography>
                    <Chip label={exp.status} size="small" color="warning" />
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {exp.progress || "Initializing..."}
                  </Typography>

                  <LinearProgress variant="determinate" value={exp.progressPercent || 0} />
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Real-time Metrics (placeholder) */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Live Metrics
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Evaluations Today
                  </Typography>
                  <Typography variant="h4">0</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Avg Response Time
                  </Typography>
                  <Typography variant="h4">-</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Success Rate
                  </Typography>
                  <Typography variant="h4">-</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

