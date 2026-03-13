/**
 * AI Gateway Sidebar Context
 *
 * Provides state management for the AI Gateway sidebar.
 * Follows the ShadowAISidebar pattern.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, FC } from "react";
import { apiServices } from "../../infrastructure/api/networkServices";

interface AIGatewaySidebarContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  endpointsCount: number;
  setEndpointsCount: (count: number) => void;
}

const AIGatewaySidebarContext = createContext<AIGatewaySidebarContextType | null>(null);

export const AIGatewaySidebarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("endpoints");
  const [endpointsCount, setEndpointsCount] = useState(0);

  const loadCounts = useCallback(async () => {
    try {
      const response = await apiServices.get("/ai-gateway/endpoints");
      const endpoints = response?.data?.data;
      if (Array.isArray(endpoints)) {
        setEndpointsCount(endpoints.filter((e: { is_active: boolean }) => e.is_active).length);
      }
    } catch {
      // Silently fail — user may not have access or module not configured
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  return (
    <AIGatewaySidebarContext.Provider
      value={{
        activeTab,
        setActiveTab,
        endpointsCount,
        setEndpointsCount,
      }}
    >
      {children}
    </AIGatewaySidebarContext.Provider>
  );
};

export const useAIGatewaySidebarContext = () => {
  const context = useContext(AIGatewaySidebarContext);
  if (!context) {
    throw new Error("useAIGatewaySidebarContext must be used within AIGatewaySidebarProvider");
  }
  return context;
};

export const useAIGatewaySidebarContextSafe = () => {
  return useContext(AIGatewaySidebarContext);
};
