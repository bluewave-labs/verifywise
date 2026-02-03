import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Search,
  Scan,
  AlertTriangle,
  CheckCircle,
  Package,
  GitBranch,
  Shield,
  ExternalLink,
  Clock,
  AlertCircle,
} from "lucide-react";
import { colors, typography, card, badge, button, progressBar } from "../styles";

// Detected libraries data
const detectedLibraries = [
  {
    name: "openai",
    version: "1.12.0",
    type: "LLM SDK",
    risk: "Medium",
    files: 12,
    status: "tracked",
  },
  {
    name: "langchain",
    version: "0.1.5",
    type: "Framework",
    risk: "Low",
    files: 8,
    status: "tracked",
  },
  {
    name: "transformers",
    version: "4.37.0",
    type: "ML Library",
    risk: "Low",
    files: 3,
    status: "tracked",
  },
  {
    name: "anthropic",
    version: "0.18.1",
    type: "LLM SDK",
    risk: "Medium",
    files: 5,
    status: "untracked",
  },
  {
    name: "torch",
    version: "2.1.0",
    type: "ML Library",
    risk: "Low",
    files: 7,
    status: "tracked",
  },
];

// Scan history data
const scanHistory = [
  {
    repo: "api-service",
    date: "Jan 24, 2025",
    libraries: 8,
    newFound: 2,
    status: "completed",
  },
  {
    repo: "ml-pipeline",
    date: "Jan 23, 2025",
    libraries: 15,
    newFound: 0,
    status: "completed",
  },
  {
    repo: "frontend-app",
    date: "Jan 22, 2025",
    libraries: 3,
    newFound: 1,
    status: "completed",
  },
];

// Risk Badge Component
const RiskBadge = ({ level }) => {
  const config = {
    High: badge.danger,
    Medium: badge.warning,
    Low: badge.success,
  };

  return <span style={{ ...badge.base, ...config[level] }}>{level}</span>;
};

// Status Indicator
const StatusIndicator = ({ status }) => {
  const isTracked = status === "tracked";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: isTracked ? colors.completed : colors.medium,
        }}
      />
      <span
        style={{
          ...typography.appSmall,
          color: isTracked ? colors.completed : colors.medium,
          textTransform: "capitalize",
        }}
      >
        {status}
      </span>
    </div>
  );
};

// Library Card Component
const LibraryCard = ({ library, index, delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: localFrame,
    fps: 30,
    from: 0.95,
    to: 1,
    config: { damping: 15, stiffness: 120 },
  });

  return (
    <div
      style={{
        ...card.base,
        padding: 16,
        opacity,
        transform: `scale(${scale})`,
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: colors.backgroundLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Package size={18} color={colors.primary} />
          </div>
          <div>
            <div
              style={{
                ...typography.appSubtitle,
                color: colors.textPrimary,
              }}
            >
              {library.name}
            </div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              v{library.version}
            </div>
          </div>
        </div>
        <RiskBadge level={library.risk} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              Type
            </div>
            <div style={{ ...typography.appBody, color: colors.textPrimary }}>
              {library.type}
            </div>
          </div>
          <div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              Files
            </div>
            <div style={{ ...typography.appBody, color: colors.textPrimary }}>
              {library.files}
            </div>
          </div>
        </div>
        <StatusIndicator status={library.status} />
      </div>
    </div>
  );
};

// Scan Progress Component
const ScanProgress = ({ progress, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const animatedProgress = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: progress,
    config: { damping: 20, stiffness: 60 },
  });

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        ...card.base,
        padding: 20,
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: `${colors.primary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Scan size={20} color={colors.primary} />
          </div>
          <div>
            <div style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
              Scanning Repository
            </div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              api-service / main branch
            </div>
          </div>
        </div>
        <span
          style={{
            ...typography.appBody,
            color: colors.primary,
            fontWeight: 600,
          }}
        >
          {Math.round(animatedProgress)}%
        </span>
      </div>

      <div style={progressBar.container}>
        <div
          style={{
            ...progressBar.fill,
            width: `${animatedProgress}%`,
            backgroundColor: colors.primary,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Package size={14} color={colors.textSecondary} />
          <span style={{ ...typography.appSmall, color: colors.textSecondary }}>
            8 libraries found
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={14} color={colors.medium} />
          <span style={{ ...typography.appSmall, color: colors.medium }}>
            2 untracked
          </span>
        </div>
      </div>
    </div>
  );
};

// Main AI Detection Component
export const AIDetection = ({ showScanProgress = false }) => {
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
            AI Detection
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Scan repositories to detect AI/ML libraries and dependencies
          </div>
        </div>
        <div style={button.primary}>
          <Scan size={14} />
          <span>New Scan</span>
        </div>
      </div>

      {/* Scan Progress (conditional) */}
      {showScanProgress && <ScanProgress progress={78} delay={10} />}

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
          { label: "Total Libraries", value: "42", icon: Package },
          { label: "Tracked", value: "38", icon: CheckCircle, color: colors.completed },
          { label: "Untracked", value: "4", icon: AlertCircle, color: colors.medium },
          { label: "High Risk", value: "2", icon: AlertTriangle, color: colors.high },
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

      {/* Libraries Grid */}
      <div>
        <div
          style={{
            ...typography.appSubtitle,
            color: colors.textPrimary,
            marginBottom: 12,
            opacity: headerOpacity,
          }}
        >
          Detected Libraries
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {detectedLibraries.map((library, index) => (
            <LibraryCard
              key={library.name}
              library={library}
              index={index}
              delay={20 + index * 5}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIDetection;
