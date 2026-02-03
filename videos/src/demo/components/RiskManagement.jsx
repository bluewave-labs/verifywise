import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  Clock,
  TrendingDown,
  ArrowRight,
  FileText,
  Users,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { colors, typography, card, badge, button, progressBar } from "../styles";

// Risk data
const risks = [
  {
    id: "RSK-001",
    title: "Bias in hiring recommendations",
    severity: "High",
    status: "Mitigating",
    model: "GPT-4 Turbo",
    owner: "Sarah Chen",
    dueDate: "Feb 15, 2025",
    progress: 65,
  },
  {
    id: "RSK-002",
    title: "Data leakage through prompts",
    severity: "Critical",
    status: "Open",
    model: "Claude 3 Opus",
    owner: "John Smith",
    dueDate: "Jan 30, 2025",
    progress: 20,
  },
  {
    id: "RSK-003",
    title: "Inconsistent output quality",
    severity: "Medium",
    status: "Mitigating",
    model: "Llama 3",
    owner: "Alex Johnson",
    dueDate: "Mar 1, 2025",
    progress: 45,
  },
  {
    id: "RSK-004",
    title: "Regulatory compliance gap",
    severity: "High",
    status: "Resolved",
    model: "Gemini Pro",
    owner: "Maria Garcia",
    dueDate: "Jan 20, 2025",
    progress: 100,
  },
];

// Mitigation actions
const mitigationActions = [
  {
    action: "Implement bias detection layer",
    status: "completed",
    assignee: "Dev Team",
  },
  {
    action: "Add input sanitization",
    status: "in_progress",
    assignee: "Security",
  },
  {
    action: "Update model guardrails",
    status: "pending",
    assignee: "ML Team",
  },
  {
    action: "Conduct red team testing",
    status: "pending",
    assignee: "QA Team",
  },
];

// Severity Badge
const SeverityBadge = ({ level }) => {
  const config = {
    Critical: badge.danger,
    High: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#EF4444" },
    Medium: badge.warning,
    Low: badge.success,
  };

  return (
    <span style={{ ...badge.base, ...config[level] }}>
      <AlertTriangle size={10} style={{ marginRight: 4 }} />
      {level}
    </span>
  );
};

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    Open: { ...badge.danger, icon: AlertTriangle },
    Mitigating: { ...badge.warning, icon: Clock },
    Resolved: { ...badge.success, icon: CheckCircle },
  };

  const { icon: Icon, ...style } = config[status] || config.Open;

  return (
    <span style={{ ...badge.base, ...style }}>
      <Icon size={10} style={{ marginRight: 4 }} />
      {status}
    </span>
  );
};

// Risk Card Component
const RiskCard = ({ risk, index, delay = 0, isExpanded = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(localFrame, [0, 12], [15, 0], {
    extrapolateRight: "clamp",
  });

  const progressWidth = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: risk.progress,
    config: { damping: 20, stiffness: 60 },
  });

  const getProgressColor = (progress, status) => {
    if (status === "Resolved") return colors.completed;
    if (progress >= 60) return colors.primary;
    if (progress >= 30) return colors.medium;
    return colors.high;
  };

  return (
    <div
      style={{
        ...card.base,
        padding: 16,
        opacity,
        transform: `translateY(${translateY}px)`,
        border: isExpanded ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span style={{ ...typography.appSmall, color: colors.textSecondary }}>
              {risk.id}
            </span>
            <SeverityBadge level={risk.severity} />
          </div>
          <div style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
            {risk.title}
          </div>
        </div>
        <StatusBadge status={risk.status} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Model
          </div>
          <div style={{ ...typography.appBody, color: colors.textPrimary }}>
            {risk.model}
          </div>
        </div>
        <div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Owner
          </div>
          <div style={{ ...typography.appBody, color: colors.textPrimary }}>
            {risk.owner}
          </div>
        </div>
        <div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Due date
          </div>
          <div style={{ ...typography.appBody, color: colors.textPrimary }}>
            {risk.dueDate}
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Mitigation progress
          </span>
          <span
            style={{
              ...typography.appSmall,
              fontWeight: 600,
              color: getProgressColor(risk.progress, risk.status),
            }}
          >
            {risk.progress}%
          </span>
        </div>
        <div style={progressBar.container}>
          <div
            style={{
              ...progressBar.fill,
              width: `${progressWidth}%`,
              backgroundColor: getProgressColor(risk.progress, risk.status),
            }}
          />
        </div>
      </div>

      {isExpanded && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${colors.borderLight}`,
          }}
        >
          <div
            style={{
              ...typography.appSmall,
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            Mitigation actions
          </div>
          {mitigationActions.map((action, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0",
              }}
            >
              {action.status === "completed" ? (
                <CheckCircle size={14} color={colors.completed} />
              ) : action.status === "in_progress" ? (
                <Clock size={14} color={colors.medium} />
              ) : (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: `1.5px solid ${colors.textSecondary}`,
                  }}
                />
              )}
              <span
                style={{
                  ...typography.appBody,
                  color: colors.textPrimary,
                  flex: 1,
                }}
              >
                {action.action}
              </span>
              <span style={{ ...typography.appSmall, color: colors.textSecondary }}>
                {action.assignee}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Risk Matrix Component
const RiskMatrix = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const matrix = [
    [0, 1, 2], // Low impact
    [1, 3, 5], // Medium impact
    [2, 4, 8], // High impact
  ];

  const impactLabels = ["Low", "Medium", "High"];
  const likelihoodLabels = ["Unlikely", "Possible", "Likely"];

  return (
    <div style={{ ...card.base, padding: 20, opacity }}>
      <div style={{ ...typography.appSubtitle, color: colors.textPrimary, marginBottom: 16 }}>
        Risk Matrix
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            paddingRight: 8,
          }}
        >
          {impactLabels.reverse().map((label) => (
            <span
              key={label}
              style={{ ...typography.appSmall, color: colors.textSecondary }}
            >
              {label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {matrix.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: "flex", gap: 4 }}>
              {row.map((count, colIndex) => {
                const intensity = (rowIndex + colIndex) / 4;
                const bgColor =
                  intensity >= 0.75
                    ? colors.critical
                    : intensity >= 0.5
                    ? colors.high
                    : intensity >= 0.25
                    ? colors.medium
                    : colors.low;

                return (
                  <div
                    key={colIndex}
                    style={{
                      width: 50,
                      height: 40,
                      backgroundColor: `${bgColor}20`,
                      border: `1px solid ${bgColor}40`,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: bgColor,
                    }}
                  >
                    {count}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {likelihoodLabels.map((label) => (
              <span
                key={label}
                style={{
                  width: 50,
                  textAlign: "center",
                  ...typography.appSmall,
                  color: colors.textSecondary,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Risk Management Component
export const RiskManagement = ({ expandedRisk = null }) => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: headerOpacity,
        }}
      >
        <div>
          <div style={{ ...typography.appTitle, color: colors.textPrimary }}>
            Risk Management
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Track and mitigate AI-related risks across your organization
          </div>
        </div>
        <div style={button.primary}>
          <AlertTriangle size={14} />
          <span>Log Risk</span>
        </div>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          opacity: headerOpacity,
        }}
      >
        {[
          { label: "Total Risks", value: "48", icon: AlertTriangle },
          { label: "Critical", value: "2", icon: Shield, color: colors.critical },
          { label: "In Mitigation", value: "12", icon: Clock, color: colors.medium },
          { label: "Resolved", value: "34", icon: CheckCircle, color: colors.completed },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} style={{ ...card.base, padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: stat.color || colors.textPrimary,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
                <Icon size={20} color={stat.color || colors.textSecondary} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
        }}
      >
        {/* Risk List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              ...typography.appSubtitle,
              color: colors.textPrimary,
              opacity: headerOpacity,
            }}
          >
            Active Risks
          </div>
          {risks.map((risk, index) => (
            <RiskCard
              key={risk.id}
              risk={risk}
              index={index}
              delay={20 + index * 6}
              isExpanded={expandedRisk === risk.id}
            />
          ))}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <RiskMatrix delay={30} />
        </div>
      </div>
    </div>
  );
};

export default RiskManagement;
