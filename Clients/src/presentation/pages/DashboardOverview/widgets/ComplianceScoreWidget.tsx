import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Chip } from '@mui/material';
import { Info } from 'lucide-react';
import { Dashboard } from '../../../../domain/types/Dashboard';
import HelperDrawer from '../../../components/HelperDrawer';

interface ComplianceScoreWidgetProps {
  data: Dashboard['compliance_score'];
  onClick?: () => void;
}

const ComplianceScoreWidget: React.FC<ComplianceScoreWidgetProps> = ({ data }) => {
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  if (!data) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Compliance score not available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { score, trend, trendValue, lastCalculated, moduleBreakdown } = data;

  // Determine score color based on value - optimized for dark background
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ade80'; // Bright green - excellent readability on dark
    if (score >= 60) return '#fbbf24'; // Bright amber - good contrast
    return '#f87171'; // Light coral red - much better contrast than standard red
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#4ade80'; // Bright green - matches score colors
      case 'down':
        return '#f87171'; // Light coral red - matches score colors
      case 'stable':
      default:
        return '#d1d5db'; // Light gray for better visibility on dark background
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'default',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 70%, #1e293b 100%)',
        border: '1px solid #374151',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      <CardContent sx={{ p: 8, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header - Centered */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem', color: '#ffffff' }}>
              AI Compliance Score
            </Typography>
            <Info
              size={16}
              color="#9ca3af"
              style={{ marginLeft: '8px', cursor: 'pointer' }}
              onClick={() => setIsHelperDrawerOpen(true)}
            />
          </Box>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#9ca3af', mb: 2 }}>
            Overall organizational compliance
          </Typography>
        </Box>

        {/* Main Score Display - Centered */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `conic-gradient(${getScoreColor(score)} ${score * 3.6}deg, #4b5563 0deg)`,
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight="900"
                  color={getScoreColor(score)}
                  sx={{
                    fontSize: '2rem',
                    fontFamily: 'monospace',
                    textShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.4)',
                    WebkitTextStroke: '1px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {score}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Trend and Last Updated - Below gauge */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{ color: getTrendColor(trend), fontWeight: 500, fontSize: '0.8rem', mb: 1 }}
            >
              {trend === 'stable' ? 'Stable' : `${Math.abs(trendValue)}% ${trend}`}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              Last updated: {formatDate(lastCalculated)}
            </Typography>
          </Box>
        </Box>

        {/* Module Breakdown */}
        <Box sx={{ flex: 1, mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2.5, fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>
            Module breakdown
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {moduleBreakdown.map((module) => (
              <Box key={module.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#e5e7eb' }}>
                    {module.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="body2" fontWeight="500" color={getScoreColor(module.score)} sx={{ fontSize: '0.8rem' }}>
                      {module.score}%
                    </Typography>
                    <Chip
                      label={`${Math.round(module.weight * 100)}%`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        backgroundColor: '#4b5563',
                        color: '#d1d5db',
                      }}
                    />
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={module.score}
                  sx={{
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: '#4b5563',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getScoreColor(module.score),
                      borderRadius: 2.5,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

      </CardContent>
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="AI Compliance Score"
        description="Comprehensive assessment of your organization's AI compliance across multiple governance domains"
        whatItDoes="Evaluates your organization's compliance across **five key AI governance modules**: Risk Management, Vendor Management, Project Governance, Model Lifecycle, and Policy & Documentation. Provides real-time scoring based on documented policies, completed assessments, and implemented controls."
        whyItMatters="**AI compliance scoring** helps organizations identify gaps in their governance frameworks and ensure regulatory readiness. Regular monitoring supports risk mitigation and demonstrates due diligence to stakeholders and auditors."
        quickActions={[
          {
            label: "View Detailed Breakdown",
            description: "Explore module-specific scores and improvement recommendations",
            primary: true
          },
          {
            label: "Update Compliance Data",
            description: "Refresh scores by updating risk assessments and policy documentation"
          }
        ]}
        useCases={[
          "**Board reporting** and executive dashboards for AI governance oversight",
          "**Audit preparation** and compliance verification for regulatory assessments"
        ]}
        keyFeatures={[
          "**Multi-module scoring** with weighted calculations across five governance domains",
          "**Real-time updates** based on policy changes and assessment completions",
          "**Trend analysis** and historical tracking for continuous improvement"
        ]}
        tips={[
          "Focus on **low-scoring modules** first for maximum impact on overall compliance score",
          "Regular **policy reviews** and assessment updates keep scores current and accurate",
          "Use **module breakdowns** to identify specific areas needing immediate attention",
          "**Module Score (left number)**: How well you're performing in that specific area - 🟩 Green (80-100%) = strong performance, 🟧 Orange (60-79%) = moderate performance, 🟥 Red (0-59%) = critical gaps",
          "**Weight (right number)**: How much that module impacts the total score - higher weights influence the overall score more",
          "**Risk & Vendor Management (30% each)** have the highest impact, **Project Governance (25%)** has significant influence, **Model Lifecycle (10%)** and **Policy Documentation (5%)** provide foundational support"
        ]}
      />
    </Card>
  );
};

export default ComplianceScoreWidget;