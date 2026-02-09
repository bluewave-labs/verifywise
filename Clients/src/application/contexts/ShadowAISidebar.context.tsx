/**
 * Shadow AI Sidebar Context
 *
 * Provides state management for the Shadow AI sidebar.
 * Follows the same pattern as AIDetectionSidebarContext.
 */

import { createContext, useContext, useState, ReactNode, FC } from "react";

interface ShadowAISidebarContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toolsCount: number;
  setToolsCount: (count: number) => void;
  alertsCount: number;
  setAlertsCount: (count: number) => void;
}

const ShadowAISidebarContext = createContext<ShadowAISidebarContextType | null>(null);

export const ShadowAISidebarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("insights");
  const [toolsCount, setToolsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);

  return (
    <ShadowAISidebarContext.Provider
      value={{
        activeTab,
        setActiveTab,
        toolsCount,
        setToolsCount,
        alertsCount,
        setAlertsCount,
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
