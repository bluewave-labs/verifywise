import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Home,
  Flag,
  FolderTree,
  Layers,
  Building,
  List,
  AlertTriangle,
  GraduationCap,
  FileText,
  BarChart3,
  Brain,
  Shield,
  AlertCircle,
  Search,
  Bell,
  Settings,
  ChevronDown,
} from "lucide-react";
import { colors, typography, appShell, interFontFace } from "../styles";

// Sidebar menu structure matching actual app
const menuStructure = {
  top: [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "tasks", label: "Tasks", icon: Flag, path: "/tasks", count: 12 },
  ],
  groups: [
    {
      name: "DISCOVERY",
      items: [
        { id: "use-cases", label: "Use Cases", icon: FolderTree },
        { id: "organizational-view", label: "Organizational View", icon: Layers },
        { id: "vendors", label: "Vendors", icon: Building },
        { id: "model-inventory", label: "Model Inventory", icon: List },
      ],
    },
    {
      name: "ASSURANCE",
      items: [
        { id: "risk-management", label: "Risk Management", icon: AlertTriangle },
        { id: "training-registry", label: "Training Registry", icon: GraduationCap },
        { id: "evidence", label: "Evidence", icon: FileText },
        { id: "reporting", label: "Reporting", icon: BarChart3 },
        { id: "ai-trust-center", label: "AI Trust Center", icon: Brain },
      ],
    },
    {
      name: "GOVERNANCE",
      items: [
        { id: "policy-manager", label: "Policy Manager", icon: Shield },
        { id: "incident-management", label: "Incident Management", icon: AlertCircle },
      ],
    },
  ],
};

// Sidebar Item Component
const SidebarItem = ({ item, isActive, onClick, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Icon = item.icon;

  const localFrame = Math.max(0, frame - delay);
  const opacity = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const itemStyle = {
    ...appShell.sidebarItem,
    ...(isActive ? appShell.sidebarItemActive : {}),
    opacity,
  };

  return (
    <div style={itemStyle} onClick={onClick}>
      <Icon size={16} strokeWidth={1.5} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count && (
        <span
          style={{
            backgroundColor: colors.primary,
            color: colors.white,
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: 10,
            minWidth: 18,
            textAlign: "center",
          }}
        >
          {item.count}
        </span>
      )}
    </div>
  );
};

// Sidebar Component
export const Sidebar = ({ activeItem = "dashboard", onNavigate }) => {
  const frame = useCurrentFrame();

  return (
    <div style={appShell.sidebar}>
      {/* Logo */}
      <div style={appShell.sidebarLogo}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              backgroundColor: colors.primary,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={18} color={colors.white} />
          </div>
          <span
            style={{
              ...typography.appTitle,
              color: colors.textPrimary,
            }}
          >
            VerifyWise
          </span>
        </div>
      </div>

      {/* Top Items */}
      <div style={{ marginBottom: 16 }}>
        {menuStructure.top.map((item, i) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            delay={i * 3}
          />
        ))}
      </div>

      {/* Menu Groups */}
      {menuStructure.groups.map((group, groupIndex) => (
        <div key={group.name} style={appShell.sidebarGroup}>
          <div style={appShell.sidebarGroupLabel}>{group.name}</div>
          {group.items.map((item, itemIndex) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeItem === item.id}
              delay={10 + groupIndex * 5 + itemIndex * 2}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Header Component
export const Header = ({ title, subtitle, showSearch = true }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ ...appShell.header, opacity }}>
      <div>
        <div style={{ ...typography.appTitle, color: colors.textPrimary }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ ...typography.appSmall, color: colors.textSecondary }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {showSearch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              backgroundColor: colors.backgroundLight,
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
            }}
          >
            <Search size={14} color={colors.textSecondary} />
            <span style={{ ...typography.appBody, color: colors.textSecondary }}>
              Search...
            </span>
          </div>
        )}

        <Bell size={18} color={colors.textSecondary} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.white,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            JD
          </div>
          <ChevronDown size={14} color={colors.textSecondary} />
        </div>
      </div>
    </div>
  );
};

// Main App Shell Component
export const AppShell = ({ activeItem, title, subtitle, children }) => {
  return (
    <div style={appShell.container}>
      <style>{interFontFace}</style>
      <Sidebar activeItem={activeItem} />
      <div style={appShell.mainContent}>
        <Header title={title} subtitle={subtitle} />
        <div style={appShell.pageContent}>{children}</div>
      </div>
    </div>
  );
};

export default AppShell;
