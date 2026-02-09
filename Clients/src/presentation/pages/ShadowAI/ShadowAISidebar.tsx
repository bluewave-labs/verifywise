/**
 * Shadow AI Sidebar Component
 *
 * Sidebar navigation for the Shadow AI module.
 * Follows the SidebarShell pattern established by AIDetectionSidebar.
 */

import { BarChart3, Users, Bot, ShieldAlert, Settings } from "lucide-react";
import SidebarShell, {
  SidebarMenuItem,
} from "../../components/Sidebar/SidebarShell";

interface ShadowAISidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  toolsCount?: number;
  alertsCount?: number;
}

export default function ShadowAISidebar({
  activeTab,
  onTabChange,
  toolsCount = 0,
  alertsCount = 0,
}: ShadowAISidebarProps) {
  const flatItems: SidebarMenuItem[] = [
    {
      id: "insights",
      label: "Insights",
      value: "insights",
      icon: <BarChart3 size={16} strokeWidth={1.5} />,
    },
    {
      id: "users",
      label: "User activity",
      value: "users",
      icon: <Users size={16} strokeWidth={1.5} />,
    },
    {
      id: "tools",
      label: "AI tools",
      value: "tools",
      icon: <Bot size={16} strokeWidth={1.5} />,
      count: toolsCount,
    },
    {
      id: "rules",
      label: "Rules",
      value: "rules",
      icon: <ShieldAlert size={16} strokeWidth={1.5} />,
      count: alertsCount,
    },
    {
      id: "settings",
      label: "Settings",
      value: "settings",
      icon: <Settings size={16} strokeWidth={1.5} />,
    },
  ];

  const isItemActive = (item: SidebarMenuItem): boolean => {
    return item.value === activeTab || item.id === activeTab;
  };

  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.value) {
      onTabChange(item.value);
    }
  };

  return (
    <SidebarShell
      flatItems={flatItems}
      isItemActive={isItemActive}
      onItemClick={handleItemClick}
      showReadyToSubscribe={false}
      enableFlyingHearts={false}
    />
  );
}
