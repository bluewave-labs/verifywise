import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface RiskData {
  level: 'high' | 'medium' | 'low';
  count: number;
  items?: string[];
}

interface RisksWidgetProps {
  loading?: boolean;
  risks?: RiskData[];
}

export const RisksWidget: React.FC<RisksWidgetProps> = ({
  loading = false,
  risks = [],
}) => {
  const theme = useTheme();

  // Default sample data
  const defaultRisks: RiskData[] = [
    {
      level: 'high',
      count: 3,
      items: ['Data breach vulnerability', 'Compliance deadline', 'Critical system update']
    },
    {
      level: 'medium',
      count: 8,
      items: ['Policy review needed', 'Training overdue', 'Access control update']
    },
    {
      level: 'low',
      count: 15,
      items: ['Documentation update', 'Quarterly review', 'Minor patches']
    },
  ];

  const riskData = risks.length > 0 ? risks : defaultRisks;

  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'high':
        return {
          color: theme.palette.error.main,
          background: alpha(theme.palette.error.main, 0.1),
          icon: <ErrorIcon />,
          label: 'High Risk',
        };
      case 'medium':
        return {
          color: theme.palette.warning.main,
          background: alpha(theme.palette.warning.main, 0.1),
          icon: <WarningIcon />,
          label: 'Medium Risk',
        };
      case 'low':
        return {
          color: theme.palette.success.main,
          background: alpha(theme.palette.success.main, 0.1),
          icon: <InfoIcon />,
          label: 'Low Risk',
        };
      default:
        return {
          color: theme.palette.text.primary,
          background: theme.palette.grey[100],
          icon: <InfoIcon />,
          label: 'Unknown',
        };
    }
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3].map((i) => (
          <Box key={i}>
            <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
          </Box>
        ))}
      </Stack>
    );
  }

  const totalRisks = riskData.reduce((sum, risk) => sum + risk.count, 0);

  return (
    <Stack spacing={2}>
      {/* Total risks summary */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {totalRisks}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Risk Items
        </Typography>
      </Box>

      {/* Risk breakdown */}
      {riskData.map((risk) => {
        const config = getRiskConfig(risk.level);
        return (
          <Paper
            key={risk.level}
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: config.background,
              border: `1px solid ${alpha(config.color, 0.2)}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {config.icon}
                </Box>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: config.color }}
                  >
                    {config.label}
                  </Typography>
                  {risk.items && risk.items[0] && (
                    <Typography variant="caption" color="text.secondary">
                      e.g., {risk.items[0]}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: config.color,
                }}
              >
                {risk.count}
              </Typography>
            </Box>
          </Paper>
        );
      })}

      {/* Risk distribution bar */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Risk Distribution
        </Typography>
        <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          {riskData.map((risk) => {
            const config = getRiskConfig(risk.level);
            const percentage = totalRisks > 0 ? (risk.count / totalRisks) * 100 : 0;
            return (
              <Box
                key={risk.level}
                sx={{
                  width: `${percentage}%`,
                  backgroundColor: config.color,
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Stack>
  );
};

export default RisksWidget;