import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { Box, Stack, Fade } from "@mui/material";
import { RefreshCw, CirclePlus } from "lucide-react";
import { SearchBox } from "../../components/Search";
import { CustomizableButton } from "../../components/button/customizable-button";
import { getAllEntities } from "../../../application/repository/entity.repository";
import PageHeader from "../../components/Layout/PageHeader";
import AgentStatusCards from "./AgentStatusCards";
import AgentTable, { AgentPrimitiveRow } from "./AgentTable";
import ReviewAgentModal from "../../components/Modals/AgentDiscovery/ReviewAgentModal";
import ManualAgentModal from "../../components/Modals/AgentDiscovery/ManualAgentModal";
import {
  agentMainStack,
  agentToastContainer,
  addAgentButton,
  syncButton,
} from "./style";
import { apiServices } from "../../../infrastructure/api/networkServices";
import HelperIcon from "../../components/HelperIcon";
import { PageBreadcrumbs } from "../../components/breadcrumbs/PageBreadcrumbs";
import {
  FilterBy,
  FilterColumn,
  FilterCondition,
} from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import { GroupBy } from "../../components/Table/GroupBy";
import {
  useTableGrouping,
  useGroupByState,
} from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";

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

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // GroupBy state
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

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
      const response = await getAllEntities({
        routeUrl: "/agent-primitives",
      });
      setAgents(response?.data || []);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // FilterBy - Dynamic options from current data
  const getUniqueSources = useCallback(() => {
    const sources = new Set<string>();
    agents.forEach((agent) => {
      if (agent.source_system) sources.add(agent.source_system);
    });
    return Array.from(sources).sort().map((s) => ({ value: s, label: s }));
  }, [agents]);

  const getUniqueTypes = useCallback(() => {
    const types = new Set<string>();
    agents.forEach((agent) => {
      if (agent.primitive_type) types.add(agent.primitive_type);
    });
    return Array.from(types).sort().map((t) => ({ value: t, label: t }));
  }, [agents]);

  // FilterBy - Column configuration
  const filterColumns: FilterColumn[] = useMemo(
    () => [
      {
        id: "display_name",
        label: "Name",
        type: "text" as const,
      },
      {
        id: "review_status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: "unreviewed", label: "Unreviewed" },
          { value: "confirmed", label: "Confirmed" },
          { value: "rejected", label: "Rejected" },
        ],
      },
      {
        id: "source_system",
        label: "Source",
        type: "select" as const,
        options: getUniqueSources(),
      },
      {
        id: "primitive_type",
        label: "Type",
        type: "select" as const,
        options: getUniqueTypes(),
      },
      {
        id: "is_stale",
        label: "Stale",
        type: "select" as const,
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
      },
    ],
    [getUniqueSources, getUniqueTypes]
  );

  // FilterBy - Field value getter
  const getFieldValue = useCallback(
    (item: AgentPrimitiveRow, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case "display_name":
          return item.display_name;
        case "review_status":
          return item.review_status;
        case "source_system":
          return item.source_system;
        case "primitive_type":
          return item.primitive_type;
        case "is_stale":
          return item.is_stale ? "true" : "false";
        case "owner_id":
          return item.owner_id;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy hook
  const { filterData, handleFilterChange: handleFilterChangeBase } =
    useFilterBy<AgentPrimitiveRow>(getFieldValue);

  const handleFilterChange = useCallback(
    (conditions: FilterCondition[], logic: "and" | "or") => {
      handleFilterChangeBase(conditions, logic);
    },
    [handleFilterChangeBase]
  );

  // Apply filters + search
  const filteredAgents = useMemo(() => {
    let filtered = filterData(agents);

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.display_name?.toLowerCase().includes(query) ||
          agent.source_system?.toLowerCase().includes(query) ||
          agent.primitive_type?.toLowerCase().includes(query) ||
          agent.owner_id?.toLowerCase().includes(query) ||
          agent.external_id?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [filterData, agents, searchTerm]);

  // GroupBy - get group key
  const getGroupKey = (agent: AgentPrimitiveRow, field: string): string | string[] => {
    switch (field) {
      case "review_status":
        return agent.review_status || "Unknown";
      case "source_system":
        return agent.source_system || "Unknown";
      case "primitive_type":
        return agent.primitive_type || "Unknown";
      case "is_stale":
        return agent.is_stale ? "Stale" : "Active";
      default:
        return "Other";
    }
  };

  // Apply grouping
  const groupedAgents = useTableGrouping({
    data: filteredAgents,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey,
  });

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

  return (
    <Stack sx={agentMainStack}>
      <PageBreadcrumbs />

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
      <Stack>
        <PageHeader
          title="Agent discovery"
          description="Automatically discover and inventory AI agents across your organization. Review discovered agents, confirm or reject them, and link them to your model inventory for governance tracking."
          rightContent={
            <HelperIcon
              articlePath="ai-governance/agent-discovery"
              size="small"
            />
          }
        />
      </Stack>

      {/* Status cards */}
      <AgentStatusCards stats={stats} />

      {/* Controls row */}
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" gap={2} alignItems="center">
            <FilterBy
              columns={filterColumns}
              onFilterChange={handleFilterChange}
            />
            <GroupBy
              options={[
                { id: "review_status", label: "Status" },
                { id: "source_system", label: "Source" },
                { id: "primitive_type", label: "Type" },
                { id: "is_stale", label: "Stale" },
              ]}
              onGroupChange={handleGroupChange}
            />
            <SearchBox
              placeholder="Search agents..."
              value={searchTerm}
              onChange={setSearchTerm}
              fullWidth={false}
            />
          </Stack>
          <Stack direction="row" gap="8px" alignItems="center">
            <CustomizableButton
              sx={syncButton}
              variant="outlined"
              onClick={handleSync}
              disabled={isSyncing}
              icon={
                <RefreshCw
                  size={14}
                  strokeWidth={1.5}
                  style={isSyncing ? { animation: "spin 1s linear infinite" } : undefined}
                />
              }
            >
              {isSyncing ? "Syncing..." : "Sync now"}
            </CustomizableButton>
            <CustomizableButton
              variant="contained"
              text="Add agent"
              sx={addAgentButton}
              icon={<CirclePlus size={16} />}
              onClick={() => setIsManualModalOpen(true)}
            />
          </Stack>
        </Stack>
      </Stack>

      {/* Table */}
      <GroupedTableView
        groupedData={groupedAgents}
        ungroupedData={filteredAgents}
        renderTable={(data) => (
          <AgentTable
            agents={data}
            isLoading={isLoading}
            onRowClick={handleRowClick}
          />
        )}
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
