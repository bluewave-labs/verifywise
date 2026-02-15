import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Box, Stack, Fade } from "@mui/material";
import { RefreshCw, Plus } from "lucide-react";
import { SearchBox } from "../../components/Search";
import { CustomizableButton } from "../../components/button/customizable-button";
import { getAllEntities } from "../../../application/repository/entity.repository";
import PageHeader from "../../components/Layout/PageHeader";
import SelectComponent from "../../components/Inputs/Select";
import AgentStatusCards from "./AgentStatusCards";
import AgentTable, { AgentPrimitiveRow } from "./AgentTable";
import ReviewAgentModal from "../../components/Modals/AgentDiscovery/ReviewAgentModal";
import ManualAgentModal from "../../components/Modals/AgentDiscovery/ManualAgentModal";
import {
  agentMainStack,
  agentFilterRow,
  agentToastContainer,
  addAgentButton,
  syncButton,
} from "./style";
import { apiServices } from "../../../infrastructure/api/networkServices";

const Alert = React.lazy(() => import("../../components/Alert"));

interface AgentStats {
  total: number;
  unreviewed: number;
  confirmed: number;
  rejected: number;
  stale: number;
}

const AgentDiscovery: React.FC = () => {
  const [agents, setAgents] = useState<AgentPrimitiveRow[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    total: 0,
    unreviewed: 0,
    confirmed: 0,
    rejected: 0,
    stale: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // Modals
  const [selectedAgent, setSelectedAgent] = useState<AgentPrimitiveRow | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Alert
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const showAlertMessage = (
    variant: "success" | "error",
    body: string
  ) => {
    setAlert({ variant, body });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.review_status = statusFilter;
      if (sourceFilter) params.source_system = sourceFilter;

      const response = await getAllEntities({
        routeUrl: "/agent-primitives",
        params,
      });
      setAgents(response?.data || []);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, sourceFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await getAllEntities({
        routeUrl: "/agent-primitives/stats",
      });
      if (response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch agent stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchStats();
  }, [fetchAgents, fetchStats]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await apiServices.post("/agent-primitives/sync");
      showAlertMessage("success", "Sync completed successfully.");
      fetchAgents();
      fetchStats();
    } catch (error) {
      showAlertMessage("error", "Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRowClick = (agent: AgentPrimitiveRow) => {
    setSelectedAgent(agent);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setIsReviewModalOpen(false);
    setSelectedAgent(null);
    fetchAgents();
    fetchStats();
    showAlertMessage("success", "Agent review status updated.");
  };

  const handleManualSuccess = () => {
    setIsManualModalOpen(false);
    fetchAgents();
    fetchStats();
    showAlertMessage("success", "Agent added successfully.");
  };

  // Get unique sources for filter dropdown
  const uniqueSources = [...new Set(agents.map((a) => a.source_system))].sort();

  const statusOptions = [
    { _id: "", name: "All statuses" },
    { _id: "unreviewed", name: "Unreviewed" },
    { _id: "confirmed", name: "Confirmed" },
    { _id: "rejected", name: "Rejected" },
  ];

  const sourceOptions = [
    { _id: "", name: "All sources" },
    ...uniqueSources.map((s) => ({ _id: s, name: s })),
  ];

  return (
    <Stack sx={agentMainStack}>
      {/* Alert */}
      <Fade in={showAlert}>
        <Box sx={agentToastContainer}>
          <Suspense fallback={null}>
            {showAlert && alert && (
              <Alert
                variant={alert.variant}
                title={alert.title}
                body={alert.body}
                isToast
                onClick={() => setShowAlert(false)}
              />
            )}
          </Suspense>
        </Box>
      </Fade>

      {/* Page header */}
      <PageHeader
        title="Agent discovery"
        description="Discover, inventory, and review AI agents across your organization."
      />

      {/* Status cards */}
      <AgentStatusCards stats={stats} />

      {/* Controls row */}
      <Stack direction="row" sx={agentFilterRow} alignItems="center" flexWrap="wrap">
        <SearchBox
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search agents..."
        />
        <SelectComponent
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as string)}
          items={statusOptions}
          placeholder="All statuses"
          sx={{ minWidth: 160 }}
        />
        <SelectComponent
          id="source-filter"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as string)}
          items={sourceOptions}
          placeholder="All sources"
          sx={{ minWidth: 160 }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <CustomizableButton
          sx={syncButton}
          variant="outlined"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw
            size={14}
            strokeWidth={1.5}
            style={isSyncing ? { animation: "spin 1s linear infinite" } : undefined}
          />
          {isSyncing ? "Syncing..." : "Sync now"}
        </CustomizableButton>
        <CustomizableButton
          sx={addAgentButton}
          variant="contained"
          onClick={() => setIsManualModalOpen(true)}
        >
          <Plus size={14} strokeWidth={1.5} color="white" />
          Add agent
        </CustomizableButton>
      </Stack>

      {/* Table */}
      <AgentTable
        agents={agents}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {/* Review modal */}
      <ReviewAgentModal
        isOpen={isReviewModalOpen}
        setIsOpen={setIsReviewModalOpen}
        agent={selectedAgent}
        onSuccess={handleReviewSuccess}
      />

      {/* Manual entry modal */}
      <ManualAgentModal
        isOpen={isManualModalOpen}
        setIsOpen={setIsManualModalOpen}
        onSuccess={handleManualSuccess}
      />
    </Stack>
  );
};

export default AgentDiscovery;
