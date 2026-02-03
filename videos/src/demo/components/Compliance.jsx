import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Scale,
  Globe,
  Building,
  ChevronRight,
  Download,
  ExternalLink,
} from "lucide-react";
import { colors, typography, card, badge, button, progressBar } from "../styles";

// Framework data
const frameworks = [
  {
    name: "EU AI Act",
    icon: Scale,
    progress: 78,
    status: "In Progress",
    controls: { total: 42, completed: 33, pending: 9 },
    deadline: "Aug 2, 2025",
    priority: "High",
  },
  {
    name: "ISO 42001",
    icon: Shield,
    progress: 92,
    status: "On Track",
    controls: { total: 56, completed: 52, pending: 4 },
    deadline: "Mar 15, 2025",
    priority: "Medium",
  },
  {
    name: "NIST AI RMF",
    icon: Building,
    progress: 85,
    status: "On Track",
    controls: { total: 38, completed: 32, pending: 6 },
    deadline: "Apr 30, 2025",
    priority: "Medium",
  },
];

// EU AI Act requirements
const euAIActRequirements = [
  {
    id: "ART-9",
    title: "Risk Management System",
    category: "High-Risk",
    status: "completed",
    evidence: 8,
  },
  {
    id: "ART-10",
    title: "Data Governance",
    category: "High-Risk",
    status: "completed",
    evidence: 12,
  },
  {
    id: "ART-11",
    title: "Technical Documentation",
    category: "High-Risk",
    status: "in_progress",
    evidence: 5,
  },
  {
    id: "ART-13",
    title: "Transparency & Information",
    category: "High-Risk",
    status: "in_progress",
    evidence: 3,
  },
  {
    id: "ART-14",
    title: "Human Oversight",
    category: "High-Risk",
    status: "pending",
    evidence: 0,
  },
  {
    id: "ART-15",
    title: "Accuracy & Robustness",
    category: "High-Risk",
    status: "pending",
    evidence: 0,
  },
];

// Status config
const statusConfig = {
  completed: { color: colors.completed, icon: CheckCircle, label: "Completed" },
  in_progress: { color: colors.medium, icon: Clock, label: "In Progress" },
  pending: { color: colors.textSecondary, icon: AlertTriangle, label: "Pending" },
};

// Framework Card Component
const FrameworkCard = ({ framework, index, delay = 0, isSelected = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: localFrame,
    fps,
    from: 0.95,
    to: 1,
    config: { damping: 15, stiffness: 120 },
  });

  const progressWidth = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: framework.progress,
    config: { damping: 20, stiffness: 60 },
  });

  const Icon = framework.icon;

  return (
    <div
      style={{
        ...card.base,
        padding: 20,
        opacity,
        transform: `scale(${scale})`,
        border: isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: `${colors.primary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={22} color={colors.primary} />
          </div>
          <div>
            <div style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
              {framework.name}
            </div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              Due: {framework.deadline}
            </div>
          </div>
        </div>
        <span
          style={{
            ...badge.base,
            ...(framework.status === "On Track" ? badge.success : badge.warning),
          }}
        >
          {framework.status}
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Compliance progress
          </span>
          <span
            style={{
              ...typography.appBody,
              fontWeight: 600,
              color: colors.primary,
            }}
          >
            {framework.progress}%
          </span>
        </div>
        <div style={progressBar.container}>
          <div
            style={{
              ...progressBar.fill,
              width: `${progressWidth}%`,
              backgroundColor: colors.primary,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 12,
          borderTop: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.completed }}>
            {framework.controls.completed}
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Completed
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.medium }}>
            {framework.controls.pending}
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Pending
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
            {framework.controls.total}
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Total
          </div>
        </div>
      </div>
    </div>
  );
};

// Requirement Row Component
const RequirementRow = ({ requirement, index, delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(localFrame, [0, 12], [-15, 0], {
    extrapolateRight: "clamp",
  });

  const config = statusConfig[requirement.status];
  const Icon = config.icon;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        backgroundColor: colors.white,
        borderRadius: 6,
        border: `1px solid ${colors.borderLight}`,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          backgroundColor: `${config.color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={14} color={config.color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              ...typography.appSmall,
              color: colors.primary,
              fontWeight: 600,
            }}
          >
            {requirement.id}
          </span>
          <span style={{ ...typography.appBody, color: colors.textPrimary }}>
            {requirement.title}
          </span>
        </div>
      </div>
      <span
        style={{
          ...badge.base,
          backgroundColor: `${config.color}10`,
          color: config.color,
        }}
      >
        {config.label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: colors.textSecondary,
        }}
      >
        <FileText size={12} />
        <span style={{ ...typography.appSmall }}>{requirement.evidence}</span>
      </div>
      <ChevronRight size={16} color={colors.textSecondary} />
    </div>
  );
};

// Compliance Summary
const ComplianceSummary = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const overallProgress = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 85,
    config: { damping: 20, stiffness: 60 },
  });

  return (
    <div style={{ ...card.base, padding: 20, opacity }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
            Overall Compliance
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Across all frameworks
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: colors.primary,
            }}
          >
            {Math.round(overallProgress)}%
          </div>
          <div style={{ ...typography.appSmall, color: colors.completed }}>
            +5% this month
          </div>
        </div>
      </div>

      <div style={progressBar.container}>
        <div
          style={{
            ...progressBar.fill,
            width: `${overallProgress}%`,
            backgroundColor: colors.primary,
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginTop: 20,
        }}
      >
        {[
          { label: "Controls Met", value: "117", total: "136" },
          { label: "Evidence Items", value: "284", total: "" },
          { label: "Days to Deadline", value: "190", total: "" },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: colors.textPrimary,
              }}
            >
              {stat.value}
              {stat.total && (
                <span style={{ color: colors.textSecondary, fontWeight: 400 }}>
                  /{stat.total}
                </span>
              )}
            </div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Compliance Component
export const Compliance = ({ selectedFramework = "EU AI Act" }) => {
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
            Compliance Management
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Track compliance across regulatory frameworks
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={button.secondary}>
            <Download size={14} />
            <span>Export Report</span>
          </div>
          <div style={button.primary}>
            <FileText size={14} />
            <span>Add Evidence</span>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <ComplianceSummary delay={5} />

      {/* Frameworks Grid */}
      <div>
        <div
          style={{
            ...typography.appSubtitle,
            color: colors.textPrimary,
            marginBottom: 12,
            opacity: headerOpacity,
          }}
        >
          Active Frameworks
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {frameworks.map((framework, index) => (
            <FrameworkCard
              key={framework.name}
              framework={framework}
              index={index}
              delay={15 + index * 5}
              isSelected={framework.name === selectedFramework}
            />
          ))}
        </div>
      </div>

      {/* EU AI Act Requirements */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            opacity: headerOpacity,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Scale size={18} color={colors.primary} />
            <span style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
              EU AI Act Requirements
            </span>
          </div>
          <span style={{ ...typography.appSmall, color: colors.textSecondary }}>
            High-Risk AI Systems
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {euAIActRequirements.map((requirement, index) => (
            <RequirementRow
              key={requirement.id}
              requirement={requirement}
              index={index}
              delay={35 + index * 4}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Compliance;
