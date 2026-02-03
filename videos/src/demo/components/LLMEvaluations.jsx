import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Shield,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";
import { colors, typography, card, badge, button, progressBar } from "../styles";

// Evaluation results data
const evaluationResults = [
  {
    name: "Toxicity Detection",
    score: 94,
    status: "passed",
    threshold: 90,
  },
  {
    name: "Bias Analysis",
    score: 87,
    status: "warning",
    threshold: 85,
  },
  {
    name: "Hallucination Rate",
    score: 92,
    status: "passed",
    threshold: 90,
  },
  {
    name: "Prompt Injection",
    score: 78,
    status: "failed",
    threshold: 85,
  },
  {
    name: "Data Leakage",
    score: 96,
    status: "passed",
    threshold: 90,
  },
];

// Recent evaluations
const recentEvaluations = [
  {
    model: "GPT-4 Turbo",
    date: "Jan 24, 2025",
    overallScore: 91,
    status: "passed",
    tests: 12,
  },
  {
    model: "Claude 3 Opus",
    date: "Jan 23, 2025",
    overallScore: 94,
    status: "passed",
    tests: 12,
  },
  {
    model: "Llama 3 70B",
    date: "Jan 22, 2025",
    overallScore: 76,
    status: "failed",
    tests: 12,
  },
];

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    passed: { ...badge.success, icon: CheckCircle },
    warning: { ...badge.warning, icon: AlertTriangle },
    failed: { ...badge.danger, icon: XCircle },
  };

  const { icon: Icon, ...style } = config[status] || config.warning;

  return (
    <span style={{ ...badge.base, ...style }}>
      <Icon size={10} style={{ marginRight: 4 }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Score Ring Component
const ScoreRing = ({ score, size = 80, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const animatedScore = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: score,
    config: { damping: 20, stiffness: 60 },
  });

  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getColor = (s) => {
    if (s >= 90) return colors.completed;
    if (s >= 80) return colors.medium;
    return colors.high;
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke={colors.backgroundLight}
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>
          {Math.round(animatedScore)}
        </div>
        <div style={{ fontSize: 10, color: colors.textSecondary }}>Score</div>
      </div>
    </div>
  );
};

// Evaluation Result Row
const EvaluationResultRow = ({ result, index, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const progressWidth = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: result.score,
    config: { damping: 20, stiffness: 60 },
  });

  const getBarColor = (status) => {
    if (status === "passed") return colors.completed;
    if (status === "warning") return colors.medium;
    return colors.high;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 0",
        borderBottom: `1px solid ${colors.borderLight}`,
        opacity,
      }}
    >
      <div style={{ width: 140 }}>
        <div style={{ ...typography.appBody, color: colors.textPrimary }}>
          {result.name}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={progressBar.container}>
          <div
            style={{
              ...progressBar.fill,
              width: `${progressWidth}%`,
              backgroundColor: getBarColor(result.status),
            }}
          />
        </div>
      </div>
      <div style={{ width: 50, textAlign: "right" }}>
        <span
          style={{
            ...typography.appBody,
            fontWeight: 600,
            color: getBarColor(result.status),
          }}
        >
          {result.score}%
        </span>
      </div>
      <div style={{ width: 80 }}>
        <StatusBadge status={result.status} />
      </div>
    </div>
  );
};

// Evaluation Card
const EvaluationCard = ({ evaluation, index, delay = 0 }) => {
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
        <div>
          <div style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
            {evaluation.model}
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            {evaluation.date}
          </div>
        </div>
        <StatusBadge status={evaluation.status} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              Overall
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color:
                  evaluation.overallScore >= 85
                    ? colors.completed
                    : colors.high,
              }}
            >
              {evaluation.overallScore}%
            </div>
          </div>
          <div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              Tests
            </div>
            <div style={{ ...typography.appBody, color: colors.textPrimary }}>
              {evaluation.tests} run
            </div>
          </div>
        </div>
        <BarChart3 size={20} color={colors.textSecondary} />
      </div>
    </div>
  );
};

// Running Evaluation Component
const RunningEvaluation = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 65,
    config: { damping: 20, stiffness: 40 },
  });

  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pulseOpacity = interpolate(
    (localFrame % 30) / 30,
    [0, 0.5, 1],
    [0.5, 1, 0.5]
  );

  return (
    <div
      style={{
        ...card.base,
        padding: 20,
        border: `1px solid ${colors.primary}30`,
        backgroundColor: `${colors.primary}05`,
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
              opacity: pulseOpacity,
            }}
          >
            <Zap size={20} color={colors.primary} />
          </div>
          <div>
            <div style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
              Evaluating GPT-4 Turbo
            </div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              Running safety & bias tests
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
          {Math.round(progress)}%
        </span>
      </div>

      <div style={progressBar.container}>
        <div
          style={{
            ...progressBar.fill,
            width: `${progress}%`,
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
          <Target size={14} color={colors.textSecondary} />
          <span style={{ ...typography.appSmall, color: colors.textSecondary }}>
            8 of 12 tests
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={14} color={colors.textSecondary} />
          <span style={{ ...typography.appSmall, color: colors.textSecondary }}>
            ~2 min remaining
          </span>
        </div>
      </div>
    </div>
  );
};

// Main LLM Evaluations Component
export const LLMEvaluations = ({ showRunning = false }) => {
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
            LLM Evaluations
          </div>
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            Test models for safety, bias, and reliability
          </div>
        </div>
        <div style={button.primary}>
          <Play size={14} />
          <span>New Evaluation</span>
        </div>
      </div>

      {/* Running Evaluation (conditional) */}
      {showRunning && <RunningEvaluation delay={10} />}

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
          { label: "Total Evaluations", value: "156", icon: BarChart3 },
          { label: "Pass Rate", value: "87%", icon: CheckCircle, color: colors.completed },
          { label: "Avg Score", value: "89", icon: TrendingUp, color: colors.primary },
          { label: "Failed Tests", value: "8", icon: XCircle, color: colors.high },
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

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Latest Results */}
        <div style={card.base}>
          <div style={card.header}>
            <span style={{ ...typography.appSubtitle, color: colors.textPrimary }}>
              Latest Results - GPT-4 Turbo
            </span>
            <ScoreRing score={91} size={60} delay={20} />
          </div>
          <div style={{ ...card.body, padding: "0 20px" }}>
            {evaluationResults.map((result, index) => (
              <EvaluationResultRow
                key={result.name}
                result={result}
                index={index}
                delay={25 + index * 5}
              />
            ))}
          </div>
        </div>

        {/* Recent Evaluations */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              ...typography.appSubtitle,
              color: colors.textPrimary,
              opacity: headerOpacity,
            }}
          >
            Recent Evaluations
          </div>
          {recentEvaluations.map((evaluation, index) => (
            <EvaluationCard
              key={evaluation.model}
              evaluation={evaluation}
              index={index}
              delay={30 + index * 6}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LLMEvaluations;
