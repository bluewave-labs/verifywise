/**
 * Shadow AI Sidebar Context
 *
 * Provides state management for the Shadow AI sidebar.
 * Follows the same pattern as AIDetectionSidebarContext.
 */

import { createContext, useContext, useState, ReactNode, FC } from "react";

export interface RecentTool {
  id: number;
  name: string;
}

interface ShadowAISidebarContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toolsCount: number;
  setToolsCount: (count: number) => void;
  alertsCount: number;
  setAlertsCount: (count: number) => void;
  recentTools: RecentTool[];
  setRecentTools: (tools: RecentTool[]) => void;
  onToolClick: ((toolId: number) => void) | undefined;
  setOnToolClick: (handler: ((toolId: number) => void) | undefined) => void;
}

const ShadowAISidebarContext = createContext<ShadowAISidebarContextType | null>(null);

export const ShadowAISidebarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("insights");
  const [toolsCount, setToolsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [recentTools, setRecentTools] = useState<RecentTool[]>([]);
  const [onToolClick, setOnToolClick] = useState<((toolId: number) => void) | undefined>();

  return (
    <ShadowAISidebarContext.Provider
      value={{
        activeTab,
        setActiveTab,
        toolsCount,
        setToolsCount,
        alertsCount,
        setAlertsCount,
        recentTools,
        setRecentTools,
        onToolClick,
        setOnToolClick,
      }}
    >
      {children}
    </ShadowAISidebarContext.Provider>
  );
};

export const useShadowAISidebarContext = () => {
  const context = useContext(ShadowAISidebarContext);
  if (!context) {
    throw new Error("useShadowAISidebarContext must be used within ShadowAISidebarProvider");
  }
  return context;
};

export const useShadowAISidebarContextSafe = () => {
  return useContext(ShadowAISidebarContext);
};
