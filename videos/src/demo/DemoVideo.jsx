import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Sequence,
  Audio,
  Easing,
} from "remotion";
import {
  Shield,
  AlertTriangle,
  Search,
  CheckCircle,
  ArrowRight,
  Globe,
  Bot,
  Scale,
  Zap,
  Lock,
  Eye,
  FileText,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { ModelInventory } from "./components/ModelInventory";
import { AIDetection } from "./components/AIDetection";
import { LLMEvaluations } from "./components/LLMEvaluations";
import { RiskManagement } from "./components/RiskManagement";
import { Compliance } from "./components/Compliance";
import { colors, typography, interFontFace } from "./styles";

// Animated wavy gradient background
const Background = () => {
  const frame = useCurrentFrame();

  // Animated gradient angle
  const gradientAngle = 135 + Math.sin(frame * 0.01) * 20;

  // Color shift over time
  const hueShift = Math.sin(frame * 0.008) * 8;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(${gradientAngle}deg,
          hsl(${158 + hueShift}, 40%, 96%) 0%,
          hsl(${168 + hueShift}, 35%, 93%) 25%,
          hsl(${163 + hueShift}, 30%, 95%) 50%,
          hsl(${153 + hueShift}, 35%, 94%) 75%,
          hsl(${158 + hueShift}, 40%, 96%) 100%)`,
      }}
    >
      {/* Bottom wave layer 1 - most visible, slowest */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: "-50%",
          width: "250%",
          height: "45%",
          transform: `translateX(${Math.sin(frame * 0.015) * 150}px)`,
        }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill={`${colors.primary}18`}
          d={`M0,${180 + Math.sin(frame * 0.03) * 40}
             C240,${120 + Math.sin(frame * 0.035 + 1) * 50},
             480,${200 + Math.cos(frame * 0.028) * 45},
             720,${140 + Math.sin(frame * 0.032) * 50}
             C960,${80 + Math.cos(frame * 0.03 + 2) * 45},
             1200,${180 + Math.sin(frame * 0.028) * 40},
             1440,${120 + Math.cos(frame * 0.035) * 50}
             L1440,320 L0,320 Z`}
        />
      </svg>

      {/* Bottom wave layer 2 */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: "-30%",
          width: "220%",
          height: "35%",
          transform: `translateX(${-Math.cos(frame * 0.02) * 120}px)`,
        }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill={`${colors.primary}12`}
          d={`M0,${160 + Math.cos(frame * 0.025) * 35}
             C360,${220 + Math.sin(frame * 0.03) * 45},
             720,${140 + Math.cos(frame * 0.028 + 1) * 40},
             1080,${200 + Math.sin(frame * 0.025) * 35}
             C1260,${160 + Math.cos(frame * 0.032) * 40},
             1440,${220 + Math.sin(frame * 0.028) * 45},
             1440,320 L0,320 Z`}
        />
      </svg>

      {/* Bottom wave layer 3 - fastest, front */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: "-20%",
          width: "200%",
          height: "25%",
          transform: `translateX(${Math.sin(frame * 0.025) * 100}px)`,
        }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill={`${colors.primary}0D`}
          d={`M0,${200 + Math.sin(frame * 0.04) * 30}
             C480,${160 + Math.cos(frame * 0.045 + 0.5) * 40},
             960,${220 + Math.sin(frame * 0.038) * 35},
             1440,${180 + Math.cos(frame * 0.042) * 30}
             L1440,320 L0,320 Z`}
        />
      </svg>

      {/* Top wave layer 1 */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: "-40%",
          width: "230%",
          height: "35%",
          transform: `translateX(${-Math.sin(frame * 0.012) * 140}px) rotate(180deg)`,
        }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill={`${colors.primary}14`}
          d={`M0,${160 + Math.sin(frame * 0.022) * 45}
             C320,${220 + Math.cos(frame * 0.028 + 1) * 50},
             640,${140 + Math.sin(frame * 0.025) * 40},
             960,${200 + Math.cos(frame * 0.03) * 45}
             C1200,${160 + Math.sin(frame * 0.022 + 2) * 50},
             1440,${220 + Math.cos(frame * 0.028) * 40},
             1440,320 L0,320 Z`}
        />
      </svg>

      {/* Top wave layer 2 */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: "-25%",
          width: "200%",
          height: "25%",
          transform: `translateX(${Math.cos(frame * 0.018) * 100}px) rotate(180deg)`,
        }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <path
          fill={`${colors.primary}0A`}
          d={`M0,${180 + Math.cos(frame * 0.032) * 35}
             C480,${140 + Math.sin(frame * 0.038 + 1) * 40},
             960,${200 + Math.cos(frame * 0.035) * 35},
             1440,${160 + Math.sin(frame * 0.04) * 40}
             L1440,320 L0,320 Z`}
        />
      </svg>

      {/* Floating gradient orbs */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          left: "-20%",
          top: "-25%",
          background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 55%)`,
          borderRadius: "50%",
          transform: `
            translateX(${Math.sin(frame * 0.015) * 80}px)
            translateY(${Math.cos(frame * 0.012) * 60}px)
          `,
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          right: "-15%",
          top: "25%",
          background: `radial-gradient(circle, ${colors.primary}12 0%, transparent 55%)`,
          borderRadius: "50%",
          transform: `
            translateX(${Math.cos(frame * 0.018) * 70}px)
            translateY(${Math.sin(frame * 0.015) * 80}px)
          `,
          filter: "blur(50px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          left: "35%",
          bottom: "-15%",
          background: `radial-gradient(circle, ${colors.primary}10 0%, transparent 55%)`,
          borderRadius: "50%",
          transform: `
            translateX(${Math.sin(frame * 0.02) * 60}px)
            translateY(${Math.cos(frame * 0.016) * 70}px)
          `,
          filter: "blur(50px)",
        }}
      />
      {/* Center floating orb */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          left: "50%",
          top: "40%",
          marginLeft: -250,
          background: `radial-gradient(circle, ${colors.primary}08 0%, transparent 60%)`,
          borderRadius: "50%",
          transform: `
            translateX(${Math.cos(frame * 0.022) * 50}px)
            translateY(${Math.sin(frame * 0.018) * 60}px)
            scale(${1 + Math.sin(frame * 0.015) * 0.1})
          `,
          filter: "blur(40px)",
        }}
      />
    </div>
  );
};

// Animated text component - faster
const AnimatedText = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(localFrame, [0, 12], [40, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        ...style,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {children}
    </div>
  );
};

// Caption component for displaying text overlays at the bottom
const Caption = ({ text, style = {} }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in at the start
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Fade out at the end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
    }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // Subtle slide up animation
  const translateY = interpolate(frame, [0, 20], [20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 100px",
        opacity,
        transform: `translateY(${translateY}px)`,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(10px)",
          padding: "16px 40px",
          borderRadius: 12,
          maxWidth: 1400,
          ...style,
        }}
      >
        <span
          style={{
            fontFamily: typography.fontFamily,
            fontSize: 32,
            fontWeight: 500,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.4,
            display: "block",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// Intro Section - Problem Statement
const IntroSection = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    from: 0.3,
    to: 1,
    config: { damping: 10, stiffness: 80 },
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle floating animation
  const floatY = Math.sin(frame * 0.08) * 8;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <style>{interFontFace}</style>

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale}) translateY(${floatY}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile("VerifyWise-logo.svg")}
          style={{
            width: 400,
            height: 400,
          }}
        />
      </div>

      {/* Tagline */}
      <AnimatedText
        delay={15}
        style={{
          fontSize: 48,
          fontWeight: 600,
          fontFamily: typography.fontFamily,
          color: colors.textPrimary,
          textAlign: "center",
        }}
      >
        AI Governance Made Simple
      </AnimatedText>

      {/* Subtitle */}
      <AnimatedText
        delay={30}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 12,
        }}
      >
        <Shield size={32} color={colors.primary} />
        <span
          style={{
            fontSize: 32,
            fontFamily: typography.fontFamily,
            color: colors.textSecondary,
            fontWeight: 500,
          }}
        >
          Trusted by enterprises worldwide
        </span>
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Problem Statement Section - faster animations
const ProblemSection = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const problems = [
    { icon: AlertTriangle, text: "Shadow AI spreading across teams" },
    { icon: Scale, text: "Complex regulatory requirements" },
    { icon: Eye, text: "Limited visibility into AI usage" },
    { icon: Lock, text: "Increasing security concerns" },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
        padding: 80,
      }}
    >
      <style>{interFontFace}</style>

      <AnimatedText
        delay={0}
        style={{
          fontSize: 42,
          fontWeight: 700,
          fontFamily: typography.fontFamily,
          color: colors.textPrimary,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        AI Is Transforming Your Business.
        <br />
        <span style={{ color: colors.primary }}>Governance Is Essential.</span>
      </AnimatedText>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          maxWidth: 900,
        }}
      >
        {problems.map((problem, i) => {
          const Icon = problem.icon;
          const delay = 10 + i * 6; // Faster stagger
          const localFrame = Math.max(0, frame - delay);

          const opacity = interpolate(localFrame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          });

          const scale = spring({
            frame: localFrame,
            fps,
            from: 0.7,
            to: 1,
            config: { damping: 12, stiffness: 200 },
          });

          const rotate = spring({
            frame: localFrame,
            fps,
            from: -5,
            to: 0,
            config: { damping: 15, stiffness: 150 },
          });

          // Pulse effect on icon
          const iconScale = 1 + Math.sin((frame - delay) * 0.15) * 0.05;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "20px 24px",
                backgroundColor: colors.white,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                opacity,
                transform: `scale(${scale}) rotate(${rotate}deg)`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: `${colors.high}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${iconScale})`,
                }}
              >
                <Icon size={24} color={colors.high} />
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  fontFamily: typography.fontFamily,
                  color: colors.textPrimary,
                }}
              >
                {problem.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Solution Section - faster animations
const SolutionSection = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const solutions = [
    { icon: Bot, text: "Complete model inventory" },
    { icon: Search, text: "Automated AI detection" },
    { icon: Shield, text: "Built-in compliance frameworks" },
    { icon: Zap, text: "Real-time risk management" },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
        padding: 80,
      }}
    >
      <style>{interFontFace}</style>

      <AnimatedText
        delay={0}
        style={{
          fontSize: 42,
          fontWeight: 700,
          fontFamily: typography.fontFamily,
          color: colors.textPrimary,
          textAlign: "center",
        }}
      >
        The Solution
      </AnimatedText>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          maxWidth: 1200,
        }}
      >
        {solutions.map((solution, i) => {
          const Icon = solution.icon;
          const delay = 10 + i * 6;
          const localFrame = Math.max(0, frame - delay);

          const opacity = interpolate(localFrame, [0, 8], [0, 1], {
            extrapolateRight: "clamp",
          });

          const scale = spring({
            frame: localFrame,
            fps,
            from: 0.6,
            to: 1,
            config: { damping: 10, stiffness: 180 },
          });

          // Bounce effect
          const bounceY = spring({
            frame: localFrame,
            fps,
            from: 30,
            to: 0,
            config: { damping: 8, stiffness: 200 },
          });

          // Icon rotation on appear
          const iconRotate = spring({
            frame: localFrame,
            fps,
            from: 180,
            to: 0,
            config: { damping: 12, stiffness: 100 },
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "32px 40px",
                backgroundColor: colors.white,
                borderRadius: 16,
                border: `1px solid ${colors.primary}30`,
                boxShadow: `0 8px 32px ${colors.primary}15`,
                opacity,
                transform: `scale(${scale}) translateY(${bounceY}px)`,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  backgroundColor: `${colors.primary}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `rotate(${iconRotate}deg)`,
                }}
              >
                <Icon size={36} color={colors.primary} />
              </div>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  fontFamily: typography.fontFamily,
                  color: colors.textPrimary,
                }}
              >
                {solution.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Use Case Title Card - faster with more motion
const UseCaseTitleCard = ({ number, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numberScale = spring({
    frame,
    fps,
    from: 0.2,
    to: 1,
    config: { damping: 8, stiffness: 120 },
  });

  const numberRotate = spring({
    frame,
    fps,
    from: -180,
    to: 0,
    config: { damping: 15, stiffness: 80 },
  });

  // Floating effect
  const floatY = Math.sin(frame * 0.1) * 5;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 32,
      }}
    >
      <style>{interFontFace}</style>

      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          backgroundColor: colors.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${numberScale}) rotate(${numberRotate}deg) translateY(${floatY}px)`,
          boxShadow: `0 12px 40px ${colors.primary}50`,
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: colors.white,
            fontFamily: typography.fontFamily,
          }}
        >
          {number}
        </span>
      </div>

      <AnimatedText
        delay={8}
        style={{
          fontSize: 56,
          fontWeight: 700,
          fontFamily: typography.fontFamily,
          color: colors.textPrimary,
          textAlign: "center",
        }}
      >
        {title}
      </AnimatedText>

      <AnimatedText
        delay={15}
        style={{
          fontSize: 28,
          fontWeight: 400,
          fontFamily: typography.fontFamily,
          color: colors.textSecondary,
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        {subtitle}
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Ken Burns effect wrapper for app demos
const KenBurnsWrapper = ({ children, variant = "zoomIn" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Different Ken Burns patterns - subtle to avoid clipping
  const patterns = {
    zoomIn: {
      startScale: 1,
      endScale: 1.03,
      startX: 0,
      endX: -5,
      startY: 0,
      endY: -4,
      startRotate: -0.3,
      endRotate: 0.2,
    },
    zoomOut: {
      startScale: 1.04,
      endScale: 1,
      startX: -8,
      endX: 4,
      startY: -5,
      endY: 2,
      startRotate: 0.3,
      endRotate: -0.2,
    },
    panLeft: {
      startScale: 1.02,
      endScale: 1.02,
      startX: 12,
      endX: -12,
      startY: 0,
      endY: -2,
      startRotate: 0.2,
      endRotate: -0.2,
    },
    panRight: {
      startScale: 1.02,
      endScale: 1.02,
      startX: -12,
      endX: 12,
      startY: -2,
      endY: 2,
      startRotate: -0.2,
      endRotate: 0.2,
    },
    diagonal: {
      startScale: 1,
      endScale: 1.04,
      startX: -8,
      endX: 8,
      startY: -5,
      endY: 5,
      startRotate: -0.5,
      endRotate: 0.5,
    },
  };

  const pattern = patterns[variant] || patterns.zoomIn;
  const progress = frame / durationInFrames;

  const scale = interpolate(progress, [0, 1], [pattern.startScale, pattern.endScale]);
  const translateX = interpolate(progress, [0, 1], [pattern.startX, pattern.endX]);
  const translateY = interpolate(progress, [0, 1], [pattern.startY, pattern.endY]);
  const rotate = interpolate(progress, [0, 1], [pattern.startRotate, pattern.endRotate]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};

// Slide transition directions
const slideDirections = {
  fromRight: { startX: 1200, startY: 0, endX: -1200, endY: 0 },
  fromLeft: { startX: -1200, startY: 0, endX: 1200, endY: 0 },
  fromBottom: { startX: 0, startY: 800, endX: 0, endY: -800 },
  fromTop: { startX: 0, startY: -800, endX: 0, endY: 800 },
  fromBottomRight: { startX: 800, startY: 600, endX: -800, endY: -600 },
  fromBottomLeft: { startX: -800, startY: 600, endX: 800, endY: -600 },
};

// App Demo Scene wrapper with Ken Burns, 3D perspective, and slide transitions
const AppDemoScene = ({
  activeItem,
  title,
  subtitle,
  children,
  kenBurnsVariant = "zoomIn",
  slideDirection = "fromRight",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slide = slideDirections[slideDirection] || slideDirections.fromRight;

  // Entrance animation (first 30 frames)
  const entranceProgress = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Exit animation (last 30 frames)
  const exitProgress = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    }
  );

  // Calculate position
  const entranceX = interpolate(entranceProgress, [0, 1], [slide.startX, 0]);
  const exitX = interpolate(exitProgress, [0, 1], [0, slide.endX]);
  const translateX = entranceX + exitX;

  const entranceY = interpolate(entranceProgress, [0, 1], [slide.startY, 0]);
  const exitY = interpolate(exitProgress, [0, 1], [0, slide.endY]);
  const translateY = entranceY + exitY;

  // Scale on entrance/exit with continuous zoom during display
  const entranceScale = interpolate(entranceProgress, [0, 1], [0.85, 1]);
  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.9]);

  // Continuous slow zoom-in during the main display (Ken Burns style)
  const zoomProgress = interpolate(
    frame,
    [30, durationInFrames - 30],
    [1, 1.08],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    }
  );

  const scale = entranceScale * exitScale * zoomProgress;

  // Opacity
  const entranceOpacity = interpolate(entranceProgress, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });
  const exitOpacity = interpolate(exitProgress, [0.5, 1], [1, 0], {
    extrapolateLeft: "clamp",
  });
  const opacity = Math.min(entranceOpacity, exitOpacity);

  // 3D rotation on entrance
  const rotateY = spring({
    frame: Math.min(frame, 40),
    fps,
    from: slideDirection.includes("Right") ? 20 : slideDirection.includes("Left") ? -20 : 0,
    to: 0,
    config: { damping: 15, stiffness: 50 },
  });

  const rotateX = spring({
    frame: Math.min(frame, 40),
    fps,
    from: slideDirection.includes("Bottom") ? -15 : slideDirection.includes("Top") ? 15 : 5,
    to: 0,
    config: { damping: 15, stiffness: 50 },
  });

  // Subtle continuous rotation during main display
  const subtleRotateY = Math.sin(frame * 0.015) * 1.2;
  const subtleRotateX = Math.cos(frame * 0.012) * 0.8;

  // Subtle pan movement during zoom (moves slightly toward center-top)
  const panX = interpolate(
    frame,
    [30, durationInFrames - 30],
    [0, -15],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const panY = interpolate(
    frame,
    [30, durationInFrames - 30],
    [0, -20],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        padding: 80,
        perspective: 2500,
        opacity,
      }}
    >
      <style>{interFontFace}</style>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `
            translate(${translateX + panX}px, ${translateY + panY}px)
            scale(${scale})
            rotateY(${rotateY + subtleRotateY}deg)
            rotateX(${rotateX + subtleRotateX}deg)
          `,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 16,
            overflow: "visible",
            boxShadow: `
              0 30px 100px rgba(0,0,0,0.25),
              0 15px 40px rgba(0,0,0,0.15)
            `,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${colors.border}`,
            }}
          >
            <AppShell activeItem={activeItem} title={title} subtitle={subtitle}>
              {children}
            </AppShell>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Value Proposition Section - faster animations
const ValuePropSection = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const values = [
    { icon: TrendingUp, value: "60%", label: "Faster compliance" },
    { icon: Shield, value: "100%", label: "Audit coverage" },
    { icon: Eye, value: "360°", label: "Visibility" },
    { icon: CheckCircle, value: "24/7", label: "Monitoring" },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 48,
        padding: 80,
      }}
    >
      <style>{interFontFace}</style>

      <AnimatedText
        delay={0}
        style={{
          fontSize: 42,
          fontWeight: 700,
          fontFamily: typography.fontFamily,
          color: colors.textPrimary,
          textAlign: "center",
        }}
      >
        Why VerifyWise?
      </AnimatedText>

      <div
        style={{
          display: "flex",
          gap: 32,
        }}
      >
        {values.map((value, i) => {
          const Icon = value.icon;
          const delay = 10 + i * 8;
          const localFrame = Math.max(0, frame - delay);

          const opacity = interpolate(localFrame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          });

          const scale = spring({
            frame: localFrame,
            fps,
            from: 0.5,
            to: 1,
            config: { damping: 10, stiffness: 200 },
          });

          const rotate = spring({
            frame: localFrame,
            fps,
            from: 10,
            to: 0,
            config: { damping: 12, stiffness: 150 },
          });

          // Counter animation for values
          const numericValue = parseInt(value.value) || 0;
          const animatedValue = Math.round(
            interpolate(localFrame, [0, 25], [0, numericValue], {
              extrapolateRight: "clamp",
            })
          );

          const displayValue = value.value.includes("%")
            ? `${animatedValue}%`
            : value.value.includes("°")
            ? `${animatedValue}°`
            : value.value;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "32px 40px",
                backgroundColor: colors.white,
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                minWidth: 180,
                opacity,
                transform: `scale(${scale}) rotate(${rotate}deg)`,
              }}
            >
              <Icon size={32} color={colors.primary} />
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: typography.fontFamily,
                  color: colors.primary,
                }}
              >
                {displayValue}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: typography.fontFamily,
                  color: colors.textSecondary,
                }}
              >
                {value.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Outro Section
const OutroSection = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    from: 0.6,
    to: 1,
    config: { damping: 10, stiffness: 80 },
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const rotate = spring({
    frame,
    fps,
    from: -10,
    to: 0,
    config: { damping: 15, stiffness: 60 },
  });

  // Floating effect
  const floatY = Math.sin(frame * 0.08) * 8;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <style>{interFontFace}</style>

      {/* Logo */}
      <div
        style={{
          opacity,
          transform: `scale(${scale}) rotate(${rotate}deg) translateY(${floatY}px)`,
        }}
      >
        <Img
          src={staticFile("VerifyWise-logo.svg")}
          style={{
            width: 400,
            height: 400,
          }}
        />
      </div>

      <AnimatedText
        delay={10}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 32,
          fontWeight: 500,
          fontFamily: typography.fontFamily,
          color: colors.textSecondary,
        }}
      >
        <Globe size={32} color={colors.primary} />
        Self-hosted or SaaS — your choice
      </AnimatedText>

      {/* CTA Button */}
      <AnimatedText delay={20}>
        <div
          style={{
            padding: "24px 56px",
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
            borderRadius: 16,
            boxShadow: `0 12px 40px ${colors.primary}50`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontFamily: typography.fontFamily,
              color: colors.white,
              fontWeight: 600,
            }}
          >
            Get Started Free
          </span>
          <ArrowRight size={36} color={colors.white} />
        </div>
      </AnimatedText>

      <AnimatedText delay={30}>
        <span
          style={{
            fontSize: 42,
            fontFamily: typography.fontFamily,
            color: colors.primary,
            fontWeight: 600,
            letterSpacing: "-0.5px",
          }}
        >
          verifywise.ai
        </span>
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Main Demo Video Composition
export const DemoVideo = () => {
  // Scene durations (in frames at 30fps) - SYNCED WITH NARRATION
  const INTRO = 90; // 3 sec (0-3s)
  const PROBLEM = 150; // 5 sec (3-8s)
  const SOLUTION = 120; // 4 sec (8-12s)
  const USE_CASE_TITLE = 90; // 3 sec
  const USE_CASE_DEMO = 240; // 8 sec
  const VALUE_PROP = 120; // 4 sec
  const OUTRO = 120; // 4 sec

  // Ken Burns variants for each use case
  const kenBurnsVariants = ["zoomIn", "panLeft", "diagonal", "panRight", "zoomOut"];

  // Slide directions for variety
  const slideDirectionVariants = [
    "fromRight",
    "fromBottomLeft",
    "fromLeft",
    "fromBottomRight",
    "fromBottom",
  ];

  // Use cases configuration with conversational captions
  const useCases = [
    {
      number: 1,
      title: "Register & Track AI Models",
      subtitle: "Maintain a complete inventory of all AI models in your organization",
      titleCaption: "Let's start with the foundation of AI governance.",
      demoCaption: "Here you can see every AI model across your organization — versions, owners, and compliance status at a glance.",
      activeItem: "model-inventory",
      pageTitle: "Model Inventory",
      pageSubtitle: "47 models registered",
      component: <ModelInventory highlightNew={true} />,
    },
    {
      number: 2,
      title: "Detect Shadow AI",
      subtitle: "Automatically scan repositories for untracked AI libraries",
      titleCaption: "But what about the AI you don't know about?",
      demoCaption: "VerifyWise automatically scans your codebase and finds hidden AI dependencies before they become compliance risks.",
      activeItem: "ai-detection",
      pageTitle: "AI Detection",
      pageSubtitle: "Scanning repositories",
      component: <AIDetection showScanProgress={true} />,
    },
    {
      number: 3,
      title: "EU AI Act Compliance",
      subtitle: "Track progress against regulatory requirements",
      titleCaption: "Regulations are complex. Compliance doesn't have to be.",
      demoCaption: "Track your progress against EU AI Act, ISO 42001, and other frameworks with built-in checklists and evidence management.",
      activeItem: "compliance",
      pageTitle: "Compliance",
      pageSubtitle: "3 frameworks active",
      component: <Compliance selectedFramework="EU AI Act" />,
    },
    {
      number: 4,
      title: "Evaluate LLM Safety",
      subtitle: "Run comprehensive safety evaluations on your models",
      titleCaption: "Is your AI safe? Let's find out.",
      demoCaption: "Run automated safety tests for toxicity, bias, hallucinations, and prompt injection vulnerabilities.",
      activeItem: "llm-evaluations",
      pageTitle: "LLM Evaluations",
      pageSubtitle: "156 evaluations completed",
      component: <LLMEvaluations showRunning={true} />,
    },
    {
      number: 5,
      title: "Assess & Mitigate Risks",
      subtitle: "Identify, track, and resolve AI-related risks",
      titleCaption: "Every risk needs an owner and a deadline.",
      demoCaption: "Assign risk owners, set mitigation deadlines, and track resolution progress across your entire AI portfolio.",
      activeItem: "risk-management",
      pageTitle: "Risk Management",
      pageSubtitle: "48 risks tracked",
      component: <RiskManagement expandedRisk="RSK-001" />,
    },
  ];

  // Calculate frame positions
  let currentFrame = 0;

  const introStart = currentFrame;
  currentFrame += INTRO;

  const problemStart = currentFrame;
  currentFrame += PROBLEM;

  const solutionStart = currentFrame;
  currentFrame += SOLUTION;

  const useCaseStarts = useCases.map((_, i) => {
    const titleStart = currentFrame;
    currentFrame += USE_CASE_TITLE;
    const demoStart = currentFrame;
    currentFrame += USE_CASE_DEMO;
    return { titleStart, demoStart };
  });

  const valuePropStart = currentFrame;
  currentFrame += VALUE_PROP;

  const outroStart = currentFrame;
  currentFrame += OUTRO;

  const totalFrames = currentFrame;

  // Music volume with fade out at the end
  const musicVolume = (frame) => {
    const fadeOutStart = totalFrames - 90; // Start fading 3 seconds before end
    if (frame < fadeOutStart) {
      return 0.25;
    }
    return interpolate(
      frame,
      [fadeOutStart, totalFrames],
      [0.25, 0],
      { extrapolateRight: "clamp" }
    );
  };

  return (
    <AbsoluteFill>
      <style>{interFontFace}</style>
      <Background />

      {/* Background music - "Inspiring Cinematic Ambient" from Pixabay (royalty-free) */}
      <Audio src={staticFile("background-music.mp3")} volume={musicVolume} />

      {/* Captions - conversational narration style */}
      <Sequence from={introStart} durationInFrames={INTRO}>
        <Caption text="Meet VerifyWise — your complete AI governance platform." />
      </Sequence>

      <Sequence from={problemStart} durationInFrames={PROBLEM}>
        <Caption text="AI is everywhere in your organization. But who's keeping track? Who's managing the risks?" />
      </Sequence>

      <Sequence from={solutionStart} durationInFrames={SOLUTION}>
        <Caption text="VerifyWise gives you complete visibility and control over every AI system you deploy." />
      </Sequence>

      {/* Use case title captions */}
      {useCases.map((useCase, i) => (
        <Sequence
          key={`title-caption-${i}`}
          from={useCaseStarts[i].titleStart}
          durationInFrames={USE_CASE_TITLE}
        >
          <Caption text={useCase.titleCaption} />
        </Sequence>
      ))}

      {/* Use case demo captions */}
      {useCases.map((useCase, i) => (
        <Sequence
          key={`demo-caption-${i}`}
          from={useCaseStarts[i].demoStart}
          durationInFrames={USE_CASE_DEMO}
        >
          <Caption text={useCase.demoCaption} />
        </Sequence>
      ))}

      <Sequence from={valuePropStart} durationInFrames={VALUE_PROP}>
        <Caption text="Join hundreds of organizations already governing AI the smart way." />
      </Sequence>

      <Sequence from={outroStart} durationInFrames={OUTRO}>
        <Caption text="Ready to take control? Visit verifywise.ai and start your free trial today." />
      </Sequence>

      {/* Intro */}
      <Sequence from={introStart} durationInFrames={INTRO}>
        <IntroSection />
      </Sequence>

      {/* Problem Statement */}
      <Sequence from={problemStart} durationInFrames={PROBLEM}>
        <ProblemSection />
      </Sequence>

      {/* Solution Overview */}
      <Sequence from={solutionStart} durationInFrames={SOLUTION}>
        <SolutionSection />
      </Sequence>

      {/* Use Cases */}
      {useCases.map((useCase, i) => (
        <React.Fragment key={i}>
          {/* Title Card */}
          <Sequence from={useCaseStarts[i].titleStart} durationInFrames={USE_CASE_TITLE}>
            <UseCaseTitleCard
              number={useCase.number}
              title={useCase.title}
              subtitle={useCase.subtitle}
            />
          </Sequence>

          {/* Demo */}
          <Sequence from={useCaseStarts[i].demoStart} durationInFrames={USE_CASE_DEMO}>
            <AppDemoScene
              activeItem={useCase.activeItem}
              title={useCase.pageTitle}
              subtitle={useCase.pageSubtitle}
              kenBurnsVariant={kenBurnsVariants[i]}
              slideDirection={slideDirectionVariants[i]}
            >
              {useCase.component}
            </AppDemoScene>
          </Sequence>
        </React.Fragment>
      ))}

      {/* Value Proposition */}
      <Sequence from={valuePropStart} durationInFrames={VALUE_PROP}>
        <ValuePropSection />
      </Sequence>

      {/* Outro */}
      <Sequence from={outroStart} durationInFrames={OUTRO}>
        <OutroSection />
      </Sequence>
    </AbsoluteFill>
  );
};

export default DemoVideo;
