import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Divider,
  LinearProgress,
  Avatar,
  Grid,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { ProjectRisk } from "../../../domain/types/ProjectRisk";

interface RiskDetailPanelProps {
  risk: ProjectRisk | null;
  onClose: () => void;
  open: boolean;
}

const RiskDetailPanel: React.FC<RiskDetailPanelProps> = ({
  risk,
  onClose,
  open,
}) => {
  if (!open || !risk) return null;

  const getRiskLevelColor = (riskLevel: number): string => {
    if (riskLevel >= 16) return "#C63622"; // Very High
    if (riskLevel >= 12) return "#D68B61"; // High
    if (riskLevel >= 8) return "#D6B971"; // Medium
    if (riskLevel >= 4) return "#52AB43"; // Low
    return "#B8D39C"; // Very Low
  };

  const getRiskLevelLabel = (riskLevel: number): string => {
    if (riskLevel >= 16) return "Very High";
    if (riskLevel >= 12) return "High";
    if (riskLevel >= 8) return "Medium";
    if (riskLevel >= 4) return "Low";
    return "Very Low";
  };

  const getSeverityLabel = (severity: number): string => {
    const labels = ["", "Very Low", "Low", "Medium", "High", "Very High"];
    return labels[severity] || "Unknown";
  };

  const getLikelihoodLabel = (likelihood: number): string => {
    const labels = ["", "Very Low", "Low", "Medium", "High", "Very High"];
    return labels[likelihood] || "Unknown";
  };

  const getMitigationProgress = (): number => {
    if (!risk.mitigations || risk.mitigations.length === 0) return 0;
    
    const completedMitigations = risk.mitigations.filter(
      m => m.status === 'completed'
    ).length;
    
    return (completedMitigations / risk.mitigations.length) * 100;
  };

  const getOverdueMitigations = () => {
    if (!risk.mitigations) return [];
    
    const now = new Date();
    return risk.mitigations.filter(mitigation => {
      if (!mitigation.deadline || mitigation.status === 'completed') return false;
      const deadline = new Date(mitigation.deadline);
      return deadline < now;
    });
  };

  const mitigationProgress = getMitigationProgress();
  const overdueMitigations = getOverdueMitigations();

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        width: { xs: '100vw', sm: 480 },
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1300,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease-in-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Paper
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
          borderLeft: "3px solid #13715B",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid #E5E7EB",
            backgroundColor: "#F9FAFB",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1, mr: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#1A1919",
                  mb: 1,
                  lineHeight: 1.3,
                }}
              >
                {risk.riskName}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={`${getRiskLevelLabel(risk.riskLevel)} Risk`}
                  sx={{
                    backgroundColor: getRiskLevelColor(risk.riskLevel),
                    color: "white",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                />
                <Chip
                  label={`L${risk.riskLevel}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "#6B7280" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Risk Metrics */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Risk Assessment
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" color="textSecondary">
                        Likelihood
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#13715B" }}>
                        {risk.likelihood || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {getLikelihoodLabel(risk.likelihood || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" color="textSecondary">
                        Severity
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "#13715B" }}>
                        {risk.riskSeverity || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {getSeverityLabel(risk.riskSeverity || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Description */}
            {risk.riskDescription && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {risk.riskDescription}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Potential Impact */}
            {risk.potentialImpact && (
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <WarningIcon sx={{ color: "#F59E0B", fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Potential Impact
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="textSecondary">
                    {risk.potentialImpact}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Owner Information */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <PersonIcon sx={{ color: "#13715B", fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Risk Owner
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "#13715B", width: 40, height: 40 }}>
                    {risk.actionOwner?.toString().charAt(0) || "?"}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Owner ID: {risk.actionOwner || "Unassigned"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Risk Owner
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Mitigation Progress */}
            {risk.mitigations && risk.mitigations.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <SecurityIcon sx={{ color: "#10B981", fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Mitigation Progress
                    </Typography>
                  </Stack>
                  
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Overall Progress
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {Math.round(mitigationProgress)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={mitigationProgress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#E5E7EB",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: mitigationProgress > 75 ? "#10B981" : mitigationProgress > 50 ? "#F59E0B" : "#EF4444",
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {risk.mitigations.length} Mitigation{risk.mitigations.length !== 1 ? 's' : ''}
                    </Typography>
                    {risk.mitigations.slice(0, 3).map((mitigation, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          backgroundColor: "#F9FAFB",
                          borderRadius: 1,
                          border: "1px solid #E5E7EB",
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {mitigation.mitigationAction || `Mitigation ${idx + 1}`}
                          </Typography>
                          <Chip
                            label={mitigation.status || 'pending'}
                            size="small"
                            color={mitigation.status === 'completed' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Stack>
                        {mitigation.deadline && (
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                            <ScheduleIcon sx={{ fontSize: 16, color: "#6B7280" }} />
                            <Typography variant="caption" color="textSecondary">
                              Due: {new Date(mitigation.deadline).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    ))}
                    {risk.mitigations.length > 3 && (
                      <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', pt: 1 }}>
                        +{risk.mitigations.length - 3} more mitigations...
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Overdue Alert */}
            {overdueMitigations.length > 0 && (
              <Card variant="outlined" sx={{ borderColor: "#EF4444", bgcolor: "#FEF2F2" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <WarningIcon sx={{ color: "#EF4444", fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#EF4444" }}>
                      Overdue Mitigations
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="textSecondary">
                    {overdueMitigations.length} mitigation{overdueMitigations.length !== 1 ? 's are' : ' is'} overdue and require immediate attention.
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Additional Metadata */}
            <Divider />
            
            <Stack spacing={1}>
              <Typography variant="caption" color="textSecondary">
                Risk ID: {risk.id}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                AI Lifecycle Phase: {risk.aiLifecyclePhase || "Not specified"}
              </Typography>
              {risk.reviewNotes && (
                <Typography variant="caption" color="textSecondary">
                  Review Notes: {risk.reviewNotes}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default RiskDetailPanel;