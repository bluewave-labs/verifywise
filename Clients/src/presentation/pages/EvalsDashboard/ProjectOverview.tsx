import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  useTheme,
  Stack,
} from "@mui/material";
import { Play, Beaker, ChevronRight, Activity, CheckCircle, Clock, Star, Coins, LucideIcon } from "lucide-react";
import { cardStyles } from "../../themes";
import CustomizableButton from "../../components/Button/CustomizableButton";
import VWLink from "../../components/Link/VWLink";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { experimentsService, monitoringService, type Experiment, type MonitorDashboard } from "../../../infrastructure/api/evaluationLogsService";
import NewExperimentModal from "./NewExperimentModal";
import type { DeepEvalProject } from "./types";
import { useNavigate } from "react-router-dom";
import HelperIcon from "../../components/HelperIcon";

interface ProjectOverviewProps {
  projectId: string;
  project: DeepEvalProject | null;
  onProjectUpdate: (project: DeepEvalProject) => void;
  onViewExperiment?: (experimentId: string) => void;
}

// Stat card component matching IntegratedDashboard MetricCard style
interface StatCardProps {
  title: string;
  value: string | number;
  Icon: LucideIcon;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, Icon, subtitle }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      elevation={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        ...(cardStyles.base(theme) as any),
        background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
        border: "1px solid #DCDFE3",
        height: "100%",
        minHeight: "90px",
        position: "relative",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        borderRadius: "4px",
        overflow: "hidden",
        "&:hover": {
          background: "linear-gradient(135deg, #F9FAFB 0%, #F1F5F9 100%)",
        },
      }}
    >
      <CardContent
        sx={{
          p: 2,
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          "&:last-child": { pb: 2 },
        }}
      >
        {/* Background Icon */}
        <Box
          sx={{
            position: "absolute",
            bottom: "-24px",
            right: "-24px",
            opacity: isHovered ? 0.06 : 0.025,
            transform: isHovered ? "translateY(-5px)" : "translateY(0px)",
            zIndex: 0,
            pointerEvents: "none",
            transition: "opacity 0.2s ease, transform 0.3s ease",
          }}
        >
          <Icon size={80} />
        </Box>

        {/* Content */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "12px",
              fontWeight: 400,
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: "28px",
              fontWeight: 600,
              color: theme.palette.text.primary,
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                fontSize: "11px",
                color: theme.palette.text.secondary,
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default function ProjectOverview({
  projectId,
  project,
  onProjectUpdate,
  onViewExperiment,
}: ProjectOverviewProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [dashboardData, setDashboardData] = useState<MonitorDashboard | null>(null);
  const [newExperimentModalOpen, setNewExperimentModalOpen] = useState(false);

  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(true);

      // Load project if not provided
      if (!project) {
        const projectData = await deepEvalProjectsService.getProject(projectId);
        onProjectUpdate(projectData.project);
      }

      // Load experiments and dashboard data in parallel
      const [experimentsData, dashboardResponse] = await Promise.all([
        experimentsService.getExperiments({ project_id: projectId, limit: 10 }),
        monitoringService.getDashboard(projectId).catch(() => ({ data: null })),
      ]);

      setExperiments(experimentsData.experiments || []);
      setDashboardData(dashboardResponse.data);
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, project, onProjectUpdate]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  const handleNewExperiment = () => {
    setNewExperimentModalOpen(true);
  };

  const handleExperimentSuccess = () => {
    // Reload stats after experiment is created
    loadOverviewData();
  };

  // Format numbers for display
  const formatNumber = (num: number | undefined, decimals = 0): string => {
    if (num === undefined || num === null || isNaN(num)) return "-";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(decimals);
  };

  const formatLatency = (ms: number | undefined): string => {
    if (ms === undefined || ms === null || isNaN(ms)) return "-";
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.round(ms)}ms`;
  };

  const formatPercentage = (rate: number | undefined): string => {
    if (rate === undefined || rate === null || isNaN(rate)) return "-";
    const successRate = 100 - rate;
    return `${successRate.toFixed(1)}%`;
  };

  const formatScore = (score: number | undefined): string => {
    if (score === undefined || score === null || isNaN(score)) return "-";
    return score.toFixed(2);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  const hasExperiments = experiments.length > 0;

  // Extract metrics from dashboard data
  const totalEvals = dashboardData?.logs?.total ?? 0;
  const successRate = dashboardData?.logs?.error_rate !== undefined
    ? formatPercentage(dashboardData.logs.error_rate)
    : "-";
  const avgLatency = dashboardData?.metrics?.latency?.average !== undefined
    ? formatLatency(dashboardData.metrics.latency.average)
    : "-";
  const avgScore = dashboardData?.metrics?.score_average?.average !== undefined
    ? formatScore(dashboardData.metrics.score_average.average)
    : "-";
  const totalTokens = dashboardData?.metrics?.token_count?.average !== undefined && dashboardData?.logs?.total
    ? formatNumber(dashboardData.metrics.token_count.average * dashboardData.logs.total)
    : "-";

  return (
    <Box>
      {/* Header + description */}
      <Stack spacing={1} mb={4}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
            Overview
          </Typography>
          <HelperIcon articlePath="llm-evals/llm-evals-overview" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Monitor your project's evaluation performance, track key metrics, and view recent experiments at a glance.
        </Typography>
      </Stack>

      {/* Header with New Experiment button */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <CustomizableButton
          onClick={handleNewExperiment}
          variant="contained"
          text="New experiment"
          icon={<Play size={16} />}
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 2,
            "&:hover": {
              backgroundColor: "#0f5a47",
            },
          }}
        />
      </Box>

      {/* Top row: 4 stat cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", mb: "16px" }}>
        <StatCard
          title="Total evaluations"
          value={formatNumber(totalEvals)}
          Icon={Activity}
        />
        <StatCard
          title="Success rate"
          value={successRate}
          Icon={CheckCircle}
        />
        <StatCard
          title="Avg latency"
          value={avgLatency}
          Icon={Clock}
        />
        <StatCard
          title="Avg score"
          value={avgScore}
          Icon={Star}
        />
      </Box>

      {/* Bottom row: Experiments table (left 50%) + Stats cards (right 50%) */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Recent experiments */}
        <Box sx={{ flex: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "14px" }}>
              Recent experiments
            </Typography>
            {hasExperiments && (
              <VWLink
                onClick={() => navigate(`/evals/${projectId}#experiments`)}
                showIcon={false}
                sx={{ fontSize: "12px" }}
              >
                View all
              </VWLink>
            )}
          </Box>

          {/* Recent experiments list */}
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            overflow: "hidden",
            backgroundColor: "#FFFFFF",
            // Fixed height to match two stat cards (90px each) + gap between them
            minHeight: "214px",
            ...(!hasExperiments && { justifyContent: "center" }),
          }}>
            {!hasExperiments ? (
              /* Empty state inside the consistent layout */
              <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Beaker size={32} color="#9CA3AF" strokeWidth={1} />
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 1, fontSize: "13px" }}
                >
                  No experiments yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, fontSize: "12px", maxWidth: 320, mx: "auto", lineHeight: 1.5 }}
                >
                  Run your first experiment to start evaluating your LLM.
                </Typography>
                <CustomizableButton
                  onClick={handleNewExperiment}
                  variant="contained"
                  text="Run first experiment"
                  icon={<Play size={14} />}
                  sx={{
                    backgroundColor: "#13715B",
                    border: "1px solid #13715B",
                    gap: 1,
                    fontSize: "12px",
                    height: "32px",
                    "&:hover": {
                      backgroundColor: "#0f5a47",
                    },
                  }}
                />
              </Box>
            ) : (
              [...experiments]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 4)
                .map((exp, index, arr) => {
                  const cfg = exp.config as { model?: { name?: string }; judgeLlm?: { model?: string; provider?: string } } | undefined;
                  const modelName = cfg?.model?.name || "-";
                  const statusLabel = exp.status === "completed" ? "Completed" :
                    exp.status === "failed" ? "Failed" :
                    exp.status === "running" ? "Running" : "Pending";
                  const statusColor = exp.status === "completed" ? "#065F46" :
                    exp.status === "failed" ? "#991B1B" :
                    exp.status === "running" ? "#1E40AF" : "#6B7280";
                  const statusBg = exp.status === "completed" ? "#D1FAE5" :
                    exp.status === "failed" ? "#FEE2E2" :
                    exp.status === "running" ? "#DBEAFE" : "#F3F4F6";

                  const createdDate = new Date(exp.created_at);
                  const formattedDate = createdDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <Box
                      key={exp.id}
                      onClick={() => {
                                        if (onViewExperiment) {
                                          onViewExperiment(exp.id);
                                        } else {
                                          navigate(`/evals/${projectId}/experiment/${exp.id}`);
                                        }
                                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 2,
                        px: 2,
                        cursor: "pointer",
                        borderBottom: index < arr.length - 1 ? "1px solid #d0d5dd" : "none",
                        flex: "0 0 auto",
                        "&:hover": {
                          backgroundColor: "#F9FAFB",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "#111827",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {exp.name || exp.id}
                          </Typography>
                          <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                            {modelName} · {formattedDate}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Chip
                          label={statusLabel}
                          size="small"
                          sx={{
                            backgroundColor: statusBg,
                            color: statusColor,
                            fontWeight: 500,
                            fontSize: "11px",
                            height: "22px",
                            borderRadius: "4px",
                          }}
                        />
                        <ChevronRight size={16} color="#9CA3AF" />
                      </Box>
                    </Box>
                  );
                })
            )}
          </Box>
        </Box>

        {/* Right side: Two stat cards stacked */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Box sx={{ height: 24 }} /> {/* Spacer to align with table header */}
          <StatCard
            title="Total tokens"
            value={totalTokens}
            Icon={Coins}
            subtitle="Across all evaluations"
          />
          <StatCard
            title="Experiments"
            value={formatNumber(experiments.length)}
            Icon={Beaker}
            subtitle="Total experiments run"
          />
        </Box>
      </Box>

      {/* New Experiment Modal */}
      <NewExperimentModal
        isOpen={newExperimentModalOpen}
        onClose={() => setNewExperimentModalOpen(false)}
        projectId={projectId}
        onSuccess={handleExperimentSuccess}
      />
    </Box>
  );
}
