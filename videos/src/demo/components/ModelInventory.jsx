import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { colors, typography, card, table, badge, button } from "../styles";

// Model data
const models = [
  {
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    version: "0125-preview",
    riskLevel: "Medium",
    status: "Approved",
    lastAssessed: "Jan 15, 2025",
  },
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    version: "20240229",
    riskLevel: "Low",
    status: "Approved",
    lastAssessed: "Jan 18, 2025",
  },
  {
    name: "Gemini Pro",
    provider: "Google",
    version: "1.0",
    riskLevel: "Medium",
    status: "Pending",
    lastAssessed: "Jan 20, 2025",
  },
  {
    name: "Llama 3",
    provider: "Meta",
    version: "70B",
    riskLevel: "High",
    status: "Restricted",
    lastAssessed: "Jan 12, 2025",
  },
  {
    name: "Mistral Large",
    provider: "Mistral AI",
    version: "2402",
    riskLevel: "Low",
    status: "Approved",
    lastAssessed: "Jan 22, 2025",
  },
];

// Status Badge Component
const StatusBadge = ({ status }) => {
  const config = {
    Approved: { ...badge.success, icon: CheckCircle },
    Pending: { ...badge.neutral, icon: Clock },
    Restricted: { ...badge.warning, icon: AlertTriangle },
    Blocked: { ...badge.danger, icon: XCircle },
  };

  const { icon: Icon, ...style } = config[status] || config.Pending;

  return (
    <span style={{ ...badge.base, ...style }}>
      <Icon size={10} style={{ marginRight: 4 }} />
      {status}
    </span>
  );
};

// Risk Level Badge
const RiskBadge = ({ level }) => {
  const config = {
    Critical: badge.danger,
    High: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#EF4444" },
    Medium: badge.warning,
    Low: badge.success,
  };

  return (
    <span style={{ ...badge.base, ...config[level] }}>
      {level}
    </span>
  );
};

// Provider Logo
const ProviderLogo = ({ provider }) => {
  const logoColors = {
    OpenAI: "#10A37F",
    Anthropic: "#D4A373",
    Google: "#4285F4",
    Meta: "#0668E1",
    "Mistral AI": "#FF7000",
  };

  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: `${logoColors[provider] || colors.primary}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
        color: logoColors[provider] || colors.primary,
      }}
    >
      {provider.charAt(0)}
    </div>
  );
};

// Table Row Component
const TableRow = ({ model, index, delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - delay);

  const opacity = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const translateX = interpolate(localFrame, [0, 12], [-20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <tr
      style={{
        ...table.row,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <td style={table.cell}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ProviderLogo provider={model.provider} />
          <div>
            <div style={{ fontWeight: 500, color: colors.textPrimary }}>
              {model.name}
            </div>
            <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
              {model.provider}
            </div>
          </div>
        </div>
      </td>
      <td style={table.cell}>{model.version}</td>
      <td style={table.cell}>
        <RiskBadge level={model.riskLevel} />
      </td>
      <td style={table.cell}>
        <StatusBadge status={model.status} />
      </td>
      <td style={table.cell}>
        <span style={{ color: colors.textSecondary }}>{model.lastAssessed}</span>
      </td>
      <td style={{ ...table.cell, textAlign: "right" }}>
        <MoreVertical size={16} color={colors.textSecondary} />
      </td>
    </tr>
  );
};

// Main Model Inventory Component
export const ModelInventory = ({ highlightNew = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // New model highlight animation
  const newModelOpacity = highlightNew
    ? interpolate(frame, [30, 45, 90, 105], [0, 1, 1, 0.7], {
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: headerOpacity,
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              backgroundColor: colors.white,
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              width: 240,
            }}
          >
            <Search size={14} color={colors.textSecondary} />
            <span style={{ ...typography.appBody, color: colors.textSecondary }}>
              Search models...
            </span>
          </div>
          <div style={{ ...button.secondary }}>
            <Filter size={14} />
            <span>Filter</span>
          </div>
        </div>
        <div style={button.primary}>
          <Plus size={14} />
          <span>Add Model</span>
        </div>
      </div>

      {/* New Model Banner (for animation) */}
      {highlightNew && (
        <div
          style={{
            backgroundColor: `${colors.primary}10`,
            border: `1px solid ${colors.primary}30`,
            borderRadius: 8,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: newModelOpacity,
          }}
        >
          <CheckCircle size={18} color={colors.primary} />
          <span style={{ ...typography.appBody, color: colors.primary, fontWeight: 500 }}>
            New model "GPT-4 Turbo" added to inventory
          </span>
        </div>
      )}

      {/* Table */}
      <div style={card.base}>
        <table style={table.container}>
          <thead>
            <tr>
              <th style={table.header}>Model</th>
              <th style={table.header}>Version</th>
              <th style={table.header}>Risk Level</th>
              <th style={table.header}>Status</th>
              <th style={table.header}>Last Assessed</th>
              <th style={{ ...table.header, width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <TableRow
                key={model.name}
                model={model}
                index={index}
                delay={15 + index * 6}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: headerOpacity,
        }}
      >
        <span style={{ ...typography.appBody, color: colors.textSecondary }}>
          Showing 1-5 of 47 models
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, "...", 10].map((page, i) => (
            <div
              key={i}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: page === 1 ? colors.primary : colors.white,
                color: page === 1 ? colors.white : colors.textPrimary,
                border: page === 1 ? "none" : `1px solid ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...typography.appBody,
                fontWeight: 500,
              }}
            >
              {page}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelInventory;
