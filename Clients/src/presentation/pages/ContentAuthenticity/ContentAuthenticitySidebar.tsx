/**
 * @fileoverview Content Authenticity Sidebar Component
 *
 * Sidebar navigation for the Content Authenticity module.
 * Follows the SidebarShell pattern established by EvalsSidebar and AIDetectionSidebar.
 *
 * @module pages/ContentAuthenticity/ContentAuthenticitySidebar
 */

import { Stamp, ScanSearch, History, FlaskConical } from "lucide-react";
import SidebarShell, {
  SidebarMenuItem,
  RecentSection,
} from "../../components/Sidebar/SidebarShell";

interface RecentJob {
  id: number;
  name: string;
  type: "embed" | "detect";
}

interface ContentAuthenticitySidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  historyCount?: number;
  recentJobs?: RecentJob[];
  onJobClick?: (jobId: number) => void;
}

export default function ContentAuthenticitySidebar({
  activeTab,
  onTabChange,
  historyCount = 0,
  recentJobs = [],
  onJobClick,
}: ContentAuthenticitySidebarProps) {
  // Menu items for Content Authenticity
  const flatItems: SidebarMenuItem[] = [
    {
      id: "embed",
      label: "Embed watermark",
      value: "embed",
      icon: <Stamp size={16} strokeWidth={1.5} />,
      disabled: false,
    },
    {
      id: "detect",
      label: "Detect watermark",
      value: "detect",
      icon: <ScanSearch size={16} strokeWidth={1.5} />,
      disabled: false,
    },
    {
      id: "robustness",
      label: "Robustness test",
      value: "robustness",
      icon: <FlaskConical size={16} strokeWidth={1.5} />,
      disabled: false,
    },
    {
      id: "history",
      label: "History",
      value: "history",
      icon: <History size={16} strokeWidth={1.5} />,
      count: historyCount,
      disabled: false,
    },
  ];

  // Recent sections
  const recentSections: RecentSection[] =
    recentJobs.length > 0
      ? [
          {
            title: "Recent jobs",
            items: recentJobs.map((job) => ({
              id: job.id.toString(),
              name: `${job.type === "embed" ? "Embed" : "Detect"}: ${job.name}`,
              onClick: () => onJobClick?.(job.id),
            })),
          },
        ]
      : [];

  // Check if item is active based on activeTab
  const isItemActive = (item: SidebarMenuItem): boolean => {
    return item.value === activeTab || item.id === activeTab;
  };

  // Handle item click - change tab
  const handleItemClick = (item: SidebarMenuItem) => {
    if (item.value) {
      onTabChange(item.value);
    }
  };

  return (
    <SidebarShell
      flatItems={flatItems}
      recentSections={recentSections}
      isItemActive={isItemActive}
      onItemClick={handleItemClick}
      showReadyToSubscribe={false}
      enableFlyingHearts={false}
    />
  );
}
