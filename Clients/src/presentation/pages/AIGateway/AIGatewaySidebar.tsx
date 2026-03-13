/**
 * AI Gateway Sidebar Component
 *
 * Sidebar navigation for the AI Gateway module.
 * Follows the SidebarShell pattern established by ShadowAISidebar.
 */

import { Router, BarChart3, MessageSquare, Settings } from "lucide-react";
import SidebarShell, {
  SidebarMenuItem,
} from "../../components/Sidebar/SidebarShell";

interface AIGatewaySidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  endpointsCount?: number;
}

export default function AIGatewaySidebar({
  activeTab,
  onTabChange,
  endpointsCount = 0,
}: AIGatewaySidebarProps) {
  const flatItems: SidebarMenuItem[] = [
    {
      id: "endpoints",
      label: "Endpoints",
      value: "endpoints",
      icon: <Router size={16} strokeWidth={1.5} />,
      count: endpointsCount,
    },
    {
      id: "spend",
      label: "Spend",
      value: "spend",
      icon: <BarChart3 size={16} strokeWidth={1.5} />,
    },
    {
      id: "playground",
      label: "Playground",
      value: "playground",
      icon: <MessageSquare size={16} strokeWidth={1.5} />,
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
      recentSections={[]}
      isItemActive={isItemActive}
      onItemClick={handleItemClick}
      showReadyToSubscribe={false}
      enableFlyingHearts={false}
    />
  );
}
