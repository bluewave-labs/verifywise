import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bot,
  Shield,
  FileText,
} from "lucide-react";
import { colors, typography, card, statCard, progressBar } from "../styles";

// Animated number counter
const AnimatedNumber = ({ value, delay = 0, suffix = "" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const animatedValue = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: value,
    config: { damping: 20, stiffness: 80 },
  });

  return (
    <span>
      {Math.round(animatedValue)}
      {suffix}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ label, value, change, changeType, icon: Icon, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(localFrame, [0, 15], [20, 0], {
    extrapolateRight: "clamp",
  });

  const isPositive = changeType === "positive";

  return (
    <div
      style={{
        ...statCard.container,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={statCard.label}>{label}</span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: `${colors.primary}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={colors.primary} />
        </div>
      </div>
      <div style={statCard.value}>
        <AnimatedNumber value={value} delay={delay} />
      </div>
      {change && (
        <div
          style={{
            ...statCard.change,
            color: isPositive ? colors.completed : colors.high,
          }}
        >
          {isPositive ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          <span>{change}</span>
          <span style={{ color: colors.textSecondary, marginLeft: 4 }}>
            vs last month
          </span>
        </div>
      )}
    </div>
  );
};

// Progress Card Component
const ProgressCard = ({ title, items, delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ ...card.base, opacity }}>
      <div style={card.header}>
        <span style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
          {title}
        </span>
      </div>
      <div style={{ ...card.body, display: "flex", flexDirection: "column", gap: 16 }}>
        {items.map((item, index) => {
          const itemDelay = delay + index * 8;
          const itemFrame = Math.max(0, frame - itemDelay);
          const progressWidth = interpolate(itemFrame, [0, 30], [0, item.progress], {
            extrapolateRight: "clamp",
          });

          return (
            <div key={index}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ ...typography.appBody, color: colors.textPrimary }}>
                  {item.label}
                </span>
                <span style={{ ...typography.appBody, color: colors.textSecondary }}>
                  {item.value}
                </span>
              </div>
              <div style={progressBar.container}>
                <div
                  style={{
                    ...progressBar.fill,
                    width: `${progressWidth}%`,
                    backgroundColor: item.color || colors.primary,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Risk Summary Card
const RiskSummaryCard = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const risks = [
    { level: "Critical", count: 2, color: colors.critical },
    { level: "High", count: 8, color: colors.high },
    { level: "Medium", count: 15, color: colors.medium },
    { level: "Low", count: 23, color: colors.low },
  ];

  return (
    <div style={{ ...card.base, opacity }}>
      <div style={card.header}>
        <span style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
          Risk Overview
        </span>
        <AlertTriangle size={16} color={colors.textSecondary} />
      </div>
      <div
        style={{
          ...card.body,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {risks.map((risk, index) => {
          const itemDelay = delay + 10 + index * 5;
          const itemFrame = Math.max(0, frame - itemDelay);
          const itemOpacity = interpolate(itemFrame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={risk.level}
              style={{
                padding: 12,
                borderRadius: 6,
                backgroundColor: `${risk.color}10`,
                border: `1px solid ${risk.color}30`,
                opacity: itemOpacity,
              }}
            >
              <div
                style={{
                  ...typography.appSmall,
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                {risk.level}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: risk.color,
                }}
              >
                <AnimatedNumber value={risk.count} delay={itemDelay} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Recent Activity Card
const RecentActivityCard = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const activities = [
    {
      icon: CheckCircle,
      text: "GPT-4 model approved for production",
      time: "2 min ago",
      color: colors.completed,
    },
    {
      icon: AlertTriangle,
      text: "New high-risk identified in Claude 3",
      time: "15 min ago",
      color: colors.high,
    },
    {
      icon: Shield,
      text: "ISO 42001 assessment completed",
      time: "1 hour ago",
      color: colors.primary,
    },
    {
      icon: FileText,
      text: "AI Policy v2.1 published",
      time: "3 hours ago",
      color: colors.textSecondary,
    },
  ];

  return (
    <div style={{ ...card.base, opacity }}>
      <div style={card.header}>
        <span style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
          Recent Activity
        </span>
        <Clock size={16} color={colors.textSecondary} />
      </div>
      <div style={{ ...card.body, padding: 0 }}>
        {activities.map((activity, index) => {
          const itemDelay = delay + 10 + index * 6;
          const itemFrame = Math.max(0, frame - itemDelay);
          const itemOpacity = interpolate(itemFrame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          });

          const Icon = activity.icon;

          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                borderBottom:
                  index < activities.length - 1
                    ? `1px solid ${colors.borderLight}`
                    : "none",
                opacity: itemOpacity,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: `${activity.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={14} color={activity.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ ...typography.appBody, color: colors.textPrimary }}
                >
                  {activity.text}
                </div>
                <div
                  style={{ ...typography.appSmall, color: colors.textSecondary }}
                >
                  {activity.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Dashboard Component
export const Dashboard = () => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <StatCard
          label="Total AI Models"
          value={47}
          change="+12%"
          changeType="positive"
          icon={Bot}
          delay={0}
        />
        <StatCard
          label="Open Risks"
          value={48}
          change="-8%"
          changeType="positive"
          icon={AlertTriangle}
          delay={5}
        />
        <StatCard
          label="Compliance Score"
          value={89}
          change="+5%"
          changeType="positive"
          icon={Shield}
          delay={10}
        />
        <StatCard
          label="Pending Tasks"
          value={12}
          change="+3"
          changeType="negative"
          icon={Clock}
          delay={15}
        />
      </div>

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <ProgressCard
          title="Framework Compliance"
          delay={20}
          items={[
            { label: "EU AI Act", value: "92%", progress: 92, color: colors.primary },
            { label: "ISO 42001", value: "78%", progress: 78, color: colors.primary },
            { label: "NIST AI RMF", value: "85%", progress: 85, color: colors.primary },
          ]}
        />
        <RiskSummaryCard delay={25} />
      </div>

      {/* Activity */}
      <RecentActivityCard delay={40} />
    </div>
  );
};

export default Dashboard;
