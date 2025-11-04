import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Play, TrendingUp } from "lucide-react";
import { deepEvalService } from "../../../infrastructure/api/deepEvalService";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import PerformanceChart from "./components/PerformanceChart";

interface ProjectOverviewProps {
  projectId: string;
  project: any;
  onProjectUpdate: (project: any) => void;
}

export default function ProjectOverview({
  projectId,
  project,
  onProjectUpdate,
}: ProjectOverviewProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentExperiments, setRecentExperiments] = useState<any[]>([]);

  useEffect(() => {
    loadOverviewData();
  }, [projectId]);

  const loadOverviewData = async () => {
    try {
      setLoading(true);

      // Load project if not provided
      if (!project) {
        const projectData = await deepEvalProjectsService.getProject(projectId);
        onProjectUpdate(projectData.project);
      }

      // Load project stats
      const statsData = await deepEvalProjectsService.getProjectStats(projectId);
      setStats(statsData.stats);

      // Load recent experiments
      const experimentsData = await deepEvalService.getAllEvaluations();
      // Filter to this project (TODO: backend should filter)
      const projectExperiments = experimentsData.evaluations.slice(0, 5);
      setRecentExperiments(projectExperiments);
    } catch (err: any) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunExperiment = () => {
    navigate(`/evals/${projectId}#experiments`);
    // TODO: Open "new experiment" modal
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Quick Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Experiments
              </Typography>
              <Typography variant="h4">{stats?.totalExperiments || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Avg Answer Relevancy
              </Typography>
              <Typography variant="h4">
                {stats?.avgMetrics?.answerRelevancy?.toFixed(2) || "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Avg Bias Score
              </Typography>
              <Typography variant="h4">
                {stats?.avgMetrics?.bias?.toFixed(2) || "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Last Run
              </Typography>
              <Typography variant="body1">
                {stats?.lastRunDate
                  ? new Date(stats.lastRunDate).toLocaleDateString()
                  : "Never"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Chart */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6">Performance Trends</Typography>
              <Typography variant="body2" color="text.secondary">
                Metric scores across experiment runs
              </Typography>
            </Box>
            <TrendingUp size={24} color="#13715B" />
          </Box>

          <PerformanceChart projectId={projectId} />
        </CardContent>
      </Card>

      {/* Recent Experiments */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Recent Experiments</Typography>
            <Button
              variant="contained"
              startIcon={<Play size={16} />}
              onClick={handleRunExperiment}
              sx={{
                textTransform: "none",
                backgroundColor: "#13715B",
                "&:hover": { backgroundColor: "#0f5a47" },
              }}
            >
              New Experiment
            </Button>
          </Box>

          {recentExperiments.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No experiments yet. Run your first experiment to get started.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleRunExperiment}
                sx={{ mt: 2, textTransform: "none" }}
              >
                Run First Experiment
              </Button>
            </Box>
          ) : (
            <Box>
              {recentExperiments.map((exp) => (
                <Box
                  key={exp.evalId}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    "&:hover": {
                      bgcolor: "action.hover",
                      cursor: "pointer",
                    },
                  }}
                  onClick={() => navigate(`/evals/${projectId}#experiments`)}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" fontWeight={600}>
                        {exp.evalId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(exp.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} textAlign="right">
                      <Typography variant="caption" display="block">
                        Status: {exp.status}
                      </Typography>
                      {exp.totalSamples > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {exp.totalSamples} samples
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

