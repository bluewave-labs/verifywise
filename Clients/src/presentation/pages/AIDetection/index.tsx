/**
 * @fileoverview AI Detection Main Page
 *
 * Container component for the AI Detection module.
 * Manages URL-based navigation and renders appropriate content.
 * Uses the same sidebar pattern as EvalsDashboard via ContextSidebar.
 *
 * @module pages/AIDetection
 */

import { useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Stack } from "@mui/material";
import { Search, History, FileSearch, Settings } from "lucide-react";
import { PageBreadcrumbs } from "../../components/Breadcrumbs/PageBreadcrumbs";
import { scanToRecentScan } from "./AIDetectionSidebar";
import ScanPage from "./ScanPage";
import HistoryPage from "./HistoryPage";
import ScanDetailsPage from "./ScanDetailsPage";
import SettingsPage from "./SettingsPage";
import { getScans } from "../../../application/repository/aiDetection.repository";
import { ScansResponse } from "../../../domain/ai-detection/types";
import { useAIDetectionSidebarContext } from "../../../application/contexts/AIDetectionSidebar.context";

type ActiveTab = "scan" | "history" | "scan-details" | "settings";
type ScanDetailsTab = "libraries" | "security" | "api-calls" | "secrets" | "models" | "rag" | "agents";

export default function AIDetectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scanId } = useParams<{ scanId: string }>();

  // Use sidebar context to share state with ContextSidebar
  const {
    setHistoryCount,
    setRecentScans,
    setOnScanClick,
  } = useAIDetectionSidebarContext();

  // Determine active tab from URL
  const getActiveTab = (): ActiveTab => {
    if (scanId) return "scan-details";
    if (location.pathname.includes("/history")) return "history";
    if (location.pathname.includes("/settings")) return "settings";
    return "scan";
  };

  // Determine scan details tab from URL
  const getScanDetailsTab = (): ScanDetailsTab => {
    if (location.pathname.endsWith("/security")) return "security";
    if (location.pathname.endsWith("/api-calls")) return "api-calls";
    if (location.pathname.endsWith("/secrets")) return "secrets";
    if (location.pathname.endsWith("/models")) return "models";
    if (location.pathname.endsWith("/rag")) return "rag";
    if (location.pathname.endsWith("/agents")) return "agents";
    return "libraries";
  };

  const activeTab = getActiveTab();
  const scanDetailsTab = getScanDetailsTab();

  // Handle scan click from recent scans - navigate to scan details
  const handleScanClick = useCallback((id: number) => {
    navigate(`/ai-detection/scans/${id}`);
  }, [navigate]);

  // Register scan click handler with context
  useEffect(() => {
    setOnScanClick(() => handleScanClick);
  }, [setOnScanClick, handleScanClick]);

  // Load recent scans for sidebar
  const loadRecentScans = useCallback(async () => {
    try {
      const response: ScansResponse = await getScans({ page: 1, limit: 5 });
      setHistoryCount(response.pagination.total);
      setRecentScans(response.scans.map(scanToRecentScan));
    } catch (error) {
      console.error("Failed to load recent scans:", error);
    }
  }, [setHistoryCount, setRecentScans]);

  useEffect(() => {
    loadRecentScans();
  }, [loadRecentScans]);

  // Handle back from scan details
  const handleBackToHistory = () => {
    navigate("/ai-detection/history");
  };

  // Handle scan completion - refresh recent scans
  const handleScanComplete = useCallback(() => {
    loadRecentScans();
  }, [loadRecentScans]);

  // Build breadcrumb items based on current tab
  const getBreadcrumbItems = () => {
    const baseItem = {
      label: "AI Detection",
      path: "/ai-detection/scan",
      icon: <FileSearch size={14} strokeWidth={1.5} />,
      onClick: () => navigate("/ai-detection/scan"),
    };

    switch (activeTab) {
      case "scan":
        return [
          baseItem,
          { label: "Scan repository", icon: <Search size={14} strokeWidth={1.5} /> },
        ];
      case "history":
        return [
          baseItem,
          { label: "Scan history", icon: <History size={14} strokeWidth={1.5} /> },
        ];
      case "settings":
        return [
          baseItem,
          { label: "Settings", icon: <Settings size={14} strokeWidth={1.5} /> },
        ];
      case "scan-details":
        return [
          baseItem,
          {
            label: "Scan history",
            path: "/ai-detection/history",
            icon: <History size={14} strokeWidth={1.5} />,
            onClick: () => navigate("/ai-detection/history"),
          },
          { label: `Scan #${scanId}`, icon: <FileSearch size={14} strokeWidth={1.5} /> },
        ];
      default:
        return [baseItem];
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "scan":
        return (
          <ScanPage
            onScanComplete={handleScanComplete}
            onViewDetails={handleScanClick}
          />
        );
      case "history":
        return (
          <HistoryPage
            onScanClick={handleScanClick}
            onScanDeleted={loadRecentScans}
          />
        );
      case "settings":
        return <SettingsPage />;
      case "scan-details":
        return scanId ? (
          <ScanDetailsPage
            scanId={parseInt(scanId, 10)}
            onBack={handleBackToHistory}
            initialTab={scanDetailsTab}
          />
        ) : (
          <ScanPage
            onScanComplete={handleScanComplete}
            onViewDetails={handleScanClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Stack className="vwhome" gap="16px">
      <PageBreadcrumbs items={getBreadcrumbItems()} />
      {renderContent()}
    </Stack>
  );
}
