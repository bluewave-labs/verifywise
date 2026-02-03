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
} from "remotion";
import {
  LayoutDashboard,
  Bot,
  AlertTriangle,
  ClipboardCheck,
  Search,
  FileText,
  Users,
  ListTodo,
  Activity,
  Shield,
  BookOpen,
  FlaskConical,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Globe,
  Lock,
  BarChart3,
  Layers,
} from "lucide-react";
import {
  colors,
  typography,
  backgroundStyle,
  gridOverlay,
  getScreenshotTransform,
  browserChrome,
  trafficLight,
  screenshotGlow,
  iconContainer,
  bulletIcon,
} from "../components/styles";

// Load Inter font
const interFontFace = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
`;

// Animated gradient orb component - lighter for light theme
const GradientOrb = ({ size, x, y, color, speed = 0.5 }) => {
  const frame = useCurrentFrame();
  const rotation = frame * speed;

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        borderRadius: "50%",
        transform: `rotate(${rotation}deg)`,
        filter: "blur(60px)",
      }}
    />
  );
};

// Browser mockup with screenshot - 20% bigger (850 * 1.2 = 1020)
const BrowserMockup = ({ src, variant, frame, fps }) => {
  const scale = spring({
    frame,
    fps,
    from: 0.85,
    to: 1,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        width: 1020,
        transform: `${getScreenshotTransform(variant, frame)} scale(${scale})`,
        opacity,
      }}
    >
      {/* Glow effect */}
      <div style={screenshotGlow} />

      {/* Browser chrome */}
      <div style={browserChrome}>
        <div style={trafficLight("#ff5f57")} />
        <div style={trafficLight("#febc2e")} />
        <div style={trafficLight("#28c840")} />
        <div
          style={{
            flex: 1,
            marginLeft: 16,
            height: 28,
            backgroundColor: "#ffffff",
            borderRadius: 6,
            border: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
          }}
        >
          <Lock size={12} color={colors.gray} style={{ marginRight: 6 }} />
          <span style={{ color: colors.gray, fontSize: 13, fontFamily: typography.fontFamily }}>
            app.verifywise.ai
          </span>
        </div>
      </div>

      {/* Screenshot */}
      <div
        style={{
          overflow: "hidden",
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          border: `1px solid ${colors.border}`,
          borderTop: "none",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};

// Animated text component
const AnimatedText = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(localFrame, [0, 20], [30, 0], {
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

// Feature bullet point with Lucide icon
const FeatureBullet = ({ text, delay, Icon = CheckCircle2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: localFrame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 10, stiffness: 150 },
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity,
      }}
    >
      <div style={{ transform: `scale(${scale})` }}>
        <Icon size={20} color={colors.primary} strokeWidth={2.5} />
      </div>
      <span
        style={{
          ...typography.feature,
          fontFamily: typography.fontFamily,
          color: colors.darkAlt,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// Intro Section
const IntroSection = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    from: 0.5,
    to: 1,
    config: { damping: 12, stiffness: 100 },
  });

  const logoOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <style>{interFontFace}</style>

      {/* Logo - centered, 2.5x original size (80 * 2.5 = 200) */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile("VerifyWise-logo.svg")}
          style={{
            width: 200,
            height: 200,
          }}
        />
      </div>

      {/* Tagline */}
      <AnimatedText
        delay={20}
        style={{
          ...typography.subheading,
          fontFamily: typography.fontFamily,
          color: colors.gray,
          textAlign: "center",
        }}
      >
        Automate compliance, improve trust, reduce risk.
      </AnimatedText>

      {/* Subtitle with icon */}
      <AnimatedText
        delay={40}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 20,
        }}
      >
        <Shield size={24} color={colors.primary} />
        <span
          style={{
            ...typography.body,
            fontFamily: typography.fontFamily,
            color: colors.darkAlt,
          }}
        >
          Trusted by enterprises worldwide
        </span>
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Feature Section Template
const FeatureSection = ({ title, description, features, screenshot, variant, Icon, bulletIcons = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isLeft = variant === "left";

  return (
    <AbsoluteFill
      style={{
        flexDirection: isLeft ? "row" : "row-reverse",
        padding: "50px 70px",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <style>{interFontFace}</style>

      {/* Text content */}
      <div
        style={{
          width: "42%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Icon + Title */}
        <AnimatedText delay={0}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={iconContainer}>
              <Icon size={26} color={colors.white} strokeWidth={2} />
            </div>
            <h2
              style={{
                ...typography.heading,
                fontFamily: typography.fontFamily,
                color: colors.dark,
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>
        </AnimatedText>

        {/* Description */}
        <AnimatedText delay={10}>
          <p
            style={{
              ...typography.body,
              fontFamily: typography.fontFamily,
              color: colors.gray,
              margin: 0,
            }}
          >
            {description}
          </p>
        </AnimatedText>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
          {features.map((feature, i) => (
            <FeatureBullet
              key={i}
              text={feature}
              delay={20 + i * 8}
              Icon={bulletIcons[i] || CheckCircle2}
            />
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div
        style={{
          width: "52%",
          display: "flex",
          justifyContent: isLeft ? "flex-end" : "flex-start",
        }}
      >
        <BrowserMockup src={screenshot} variant={variant} frame={frame} fps={fps} />
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
    from: 0.8,
    to: 1,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

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

      {/* Large Logo - matching intro size (200px) */}
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile("VerifyWise-logo.svg")}
          style={{
            width: 200,
            height: 200,
          }}
        />
      </div>

      <AnimatedText
        delay={15}
        style={{
          ...typography.subheading,
          fontFamily: typography.fontFamily,
          color: colors.gray,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Globe size={24} color={colors.primary} />
        Self-host or SaaS
      </AnimatedText>

      {/* CTA Button */}
      <AnimatedText delay={30}>
        <div
          style={{
            padding: "18px 40px",
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
            borderRadius: 12,
            boxShadow: `0 8px 30px ${colors.primary}40`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontFamily: typography.fontFamily,
              color: colors.white,
              fontWeight: 600,
            }}
          >
            Get Started
          </span>
          <ArrowRight size={22} color={colors.white} />
        </div>
      </AnimatedText>

      <AnimatedText delay={45}>
        <span
          style={{
            ...typography.body,
            fontFamily: typography.fontFamily,
            color: colors.primary,
            fontWeight: 500,
          }}
        >
          verifywise.ai
        </span>
      </AnimatedText>
    </AbsoluteFill>
  );
};

// Main composition
export const AllFeaturesVideo = () => {
  const frame = useCurrentFrame();

  // All feature sections using all available screenshots
  const sections = [
    {
      title: "Dashboard",
      description: "Get a comprehensive overview of your AI governance status at a glance.",
      features: [
        "Real-time compliance metrics",
        "Risk assessment overview",
        "Task progress tracking",
        "Quick action shortcuts",
      ],
      screenshot: "dashboard.png",
      Icon: LayoutDashboard,
      bulletIcons: [BarChart3, AlertTriangle, ListTodo, ArrowRight],
    },
    {
      title: "AI Model Registry",
      description: "Track and manage all your AI models in a centralized inventory.",
      features: [
        "Complete model lifecycle tracking",
        "Risk classification labels",
        "Vendor and deployment info",
        "Compliance status indicators",
      ],
      screenshot: "models.png",
      Icon: Bot,
      bulletIcons: [Layers, AlertTriangle, Users, CheckCircle2],
    },
    {
      title: "Risk Management",
      description: "Identify, assess, and mitigate AI-related risks systematically.",
      features: [
        "Risk heat maps and matrices",
        "Mitigation action tracking",
        "Impact and likelihood scoring",
        "Audit trail for all changes",
      ],
      screenshot: "risk-management.png",
      Icon: AlertTriangle,
      bulletIcons: [BarChart3, CheckCircle2, Activity, FileText],
    },
    {
      title: "NIST AI RMF",
      description: "Built-in support for NIST AI Risk Management Framework.",
      features: [
        "Govern, Map, Measure, Manage",
        "Pre-built control mappings",
        "Evidence collection tools",
        "Compliance gap analysis",
      ],
      screenshot: "nist-ai-rmf.png",
      Icon: ClipboardCheck,
      bulletIcons: [Shield, Layers, FileText, Search],
    },
    {
      title: "ISO 42001",
      description: "Align with ISO/IEC 42001 AI Management System standards.",
      features: [
        "Clause-by-clause guidance",
        "Policy template library",
        "Risk treatment plans",
        "Continuous monitoring",
      ],
      screenshot: "isoframework.png",
      Icon: BookOpen,
      bulletIcons: [FileText, ClipboardCheck, Shield, Activity],
    },
    {
      title: "CE Marking",
      description: "Prepare for EU AI Act conformity assessment requirements.",
      features: [
        "High-risk AI checklist",
        "Technical documentation",
        "Conformity assessment prep",
        "Declaration of conformity",
      ],
      screenshot: "cemarking.png",
      Icon: Shield,
      bulletIcons: [CheckCircle2, FileText, ClipboardCheck, Globe],
    },
    {
      title: "AI Detection",
      description: "Scan and detect AI components in your codebase automatically.",
      features: [
        "Repository scanning",
        "Library detection",
        "Security vulnerability alerts",
        "Dependency analysis",
      ],
      screenshot: "ai-detection-history.png",
      Icon: Search,
      bulletIcons: [Cpu, Layers, AlertTriangle, Activity],
    },
    {
      title: "Library Detection",
      description: "Automatically identify AI/ML libraries in your projects.",
      features: [
        "Framework detection",
        "Version tracking",
        "License compliance",
        "Usage analytics",
      ],
      screenshot: "ai-detection-libraries-tab.png",
      Icon: Cpu,
      bulletIcons: [Search, Layers, Shield, BarChart3],
    },
    {
      title: "Policy Manager",
      description: "Create and enforce AI governance policies across your organization.",
      features: [
        "Policy templates library",
        "Version control for policies",
        "Approval workflows",
        "Policy-to-control mapping",
      ],
      screenshot: "policy-manager.png",
      Icon: FileText,
      bulletIcons: [ClipboardCheck, Layers, Users, CheckCircle2],
    },
    {
      title: "Vendor Management",
      description: "Track and assess third-party AI vendors and their risks.",
      features: [
        "Vendor risk assessments",
        "Contract management",
        "Due diligence tracking",
        "SLA monitoring",
      ],
      screenshot: "vendors.png",
      Icon: Users,
      bulletIcons: [AlertTriangle, FileText, CheckCircle2, Activity],
    },
    {
      title: "Task Management",
      description: "Organize and track compliance tasks across your team.",
      features: [
        "Task assignments",
        "Due date tracking",
        "Priority management",
        "Progress reporting",
      ],
      screenshot: "tasks.png",
      Icon: ListTodo,
      bulletIcons: [Users, Activity, AlertTriangle, BarChart3],
    },
    {
      title: "Activity Log",
      description: "Complete audit trail of all governance activities.",
      features: [
        "User action tracking",
        "Change history",
        "Compliance evidence",
        "Export capabilities",
      ],
      screenshot: "activity.png",
      Icon: Activity,
      bulletIcons: [FileText, Users, Search, CheckCircle2],
    },
    {
      title: "LLM Evaluations",
      description: "Evaluate and benchmark your large language models.",
      features: [
        "Performance metrics",
        "Bias detection",
        "Quality assessments",
        "Comparison reports",
      ],
      screenshot: "llmevals.png",
      Icon: FlaskConical,
      bulletIcons: [BarChart3, AlertTriangle, CheckCircle2, FileText],
    },
  ];

  // Calculate total duration: intro (150) + sections (200 each) + outro (210)
  const sectionDuration = 200;

  return (
    <AbsoluteFill>
      <style>{interFontFace}</style>

      {/* Background */}
      <div style={backgroundStyle} />

      {/* Animated orbs - lighter for light theme */}
      <GradientOrb size={600} x="-10%" y="-20%" color={colors.primary} speed={0.3} />
      <GradientOrb size={400} x="70%" y="60%" color={colors.accent} speed={-0.2} />
      <GradientOrb size={500} x="40%" y="-30%" color={colors.primaryLight} speed={0.4} />

      {/* Grid overlay */}
      <div style={gridOverlay} />

      {/* Intro - frames 0-150 */}
      <Sequence from={0} durationInFrames={150}>
        <IntroSection />
      </Sequence>

      {/* Feature sections */}
      {sections.map((section, index) => (
        <Sequence
          key={index}
          from={150 + index * sectionDuration}
          durationInFrames={sectionDuration}
        >
          <FeatureSection
            {...section}
            variant={index % 2 === 0 ? "right" : "left"}
          />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={150 + sections.length * sectionDuration} durationInFrames={210}>
        <OutroSection />
      </Sequence>
    </AbsoluteFill>
  );
};
