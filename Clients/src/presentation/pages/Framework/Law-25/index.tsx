import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { getEntityById, updateEntityById } from "../../../../application/repository/entity.repository";
import { useCallback, useEffect, useState, useMemo } from "react";
import { styles } from "../ISO27001/Clause/style";
import { ArrowRight as RightArrowBlack } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import StatusDropdown from "../../../components/StatusDropdown";
import { useAuth } from "../../../../application/hooks/useAuth";
import allowedRoles from "../../../../application/constants/permissions";
import { Project } from "../../../../domain/types/Project";
import { handleAlert } from "../../../../application/tools/alertUtils";
import Alert from "../../../components/Alert";
import { AlertProps } from "../../../../domain/interfaces/i.alert";
import Law25DrawerDialog from "../../../components/Drawer/Law25DrawerDialog";
import TabFilterBar from "../../../components/FrameworkFilter/TabFilterBar";

interface Law25RequirementsProps {
  project: Project;
  projectFrameworkId: number | string;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  statusOptions?: { value: string; label: string }[];
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
}

const Law25Requirements = ({
  project: _project,
  projectFrameworkId,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  searchTerm = "",
  onSearchTermChange,
}: Law25RequirementsProps) => {
  const { userId: _userId, userRoleName } = useAuth();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [flashingRowId, setFlashingRowId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const topicId = searchParams.get("topicId");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  const fetchTopicsWithRequirements = useCallback(async () => {
    if (!projectFrameworkId) return;

    setLoading(true);
    try {
      const response = await getEntityById({
        routeUrl: `/law-25/topics/byProjectFrameworkId/${projectFrameworkId}`,
      });
      setTopics(response.data || []);
    } catch (error) {
      console.error("Error fetching Law-25 topics:", error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [projectFrameworkId]);

  useEffect(() => {
    fetchTopicsWithRequirements();
  }, [fetchTopicsWithRequirements, refreshTrigger]);

  const handleAccordionChange =
    (panel: number) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);

      // Update URL parameters when accordion changes
      if (isExpanded) {
        searchParams.set("topicId", String(panel));
        setSearchParams(searchParams);
      } else {
        searchParams.delete("topicId");
        searchParams.delete("requirementId");
        setSearchParams(searchParams);
      }
    };

  const handleRequirementClick = useCallback(
    (topic: any, requirement: any, _index: number) => {
      setSelectedTopic(topic);
      setSelectedRequirement(requirement);
      setDrawerOpen(true);
    },
    []
  );

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedRequirement(null);
    setSelectedTopic(null);
  };

  const handleDrawerSaveSuccess = (success: boolean, _message?: string, savedRequirementId?: number) => {
    if (success && savedRequirementId) {
      // Set flashing row ID for green highlighting
      setFlashingRowId(savedRequirementId);
      setTimeout(() => setFlashingRowId(null), 2000);

      // Refresh the data after successful save
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleStatusUpdate = async (
    updatedStatus: string,
    requirement: any,
    topicIndex: number,
    requirementIndex: number
  ): Promise<boolean> => {
    try {
      // Update the local state to show the new status immediately
      setTopics((prevTopics) => {
        const updated = [...prevTopics];
        if (updated[topicIndex] && updated[topicIndex].requirements) {
          updated[topicIndex].requirements = updated[topicIndex].requirements.map(
            (item: any, idx: number) =>
              idx === requirementIndex ? { ...item, status: updatedStatus } : item
          );
        }
        return updated;
      });

      // Flash the row to indicate it was saved
      setFlashingRowId(requirement.id);
      setTimeout(() => setFlashingRowId(null), 2000);

      // Call the API to update status
      const response = await updateEntityById({
        routeUrl: `/law-25/requirements/${requirement.id}`,
        body: { status: updatedStatus },
      });

      if (response.status >= 200 && response.status < 300) {
        // Show success alert
        handleAlert({
          variant: "success",
          body: "Status updated successfully",
          setAlert,
        });

        // Trigger a refresh to ensure data consistency
        setRefreshTrigger((prev) => prev + 1);
        return true;
      } else {
        // Show error alert if update failed
        handleAlert({
          variant: "error",
          body: "Failed to update status",
          setAlert,
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating requirement status:", error);

      // Show error alert
      handleAlert({
        variant: "error",
        body: "Error updating status",
        setAlert,
      });

      // Revert the status update on error
      setRefreshTrigger((prev) => prev + 1);
      return false;
    }
  };

  // Set initial expanded state based on URL parameters
  useEffect(() => {
    if (topicId && topics.length > 0) {
      const topic = topics.find((t) => t.id === Number(topicId));
      if (topic) {
        setExpanded(topic.id);
      }
    }
  }, [topicId, topics]);

  function renderRequirements(topic: any, topicIndex: number) {
    const requirements = topic.requirements || [];

    // Apply status filter if provided
    const filteredRequirements =
      statusFilter && statusFilter !== "" && statusFilter !== "all"
        ? requirements.filter(
            (req: any) => req.status?.toLowerCase() === statusFilter.toLowerCase()
          )
        : requirements;

    return (
      <AccordionDetails sx={{ padding: 0 }}>
        {filteredRequirements.length > 0 ? (
          filteredRequirements.map((requirement: any, index: number) => (
            <Stack
              key={requirement.id || requirement.struct_id}
              onClick={() => {
                handleRequirementClick(topic, requirement, index);
              }}
              sx={styles.subClauseRow(
                filteredRequirements.length - 1 === index,
                flashingRowId === requirement.id
              )}
            >
              <Stack sx={{ flex: 1, pr: 2 }}>
                <Typography fontSize={13} fontWeight={600} color="#1a1a1a">
                  {requirement.requirement_id || `${topic.topic_id}.${requirement.order_no}`}
                </Typography>
                {requirement.name && (
                  <Typography
                    fontSize={12}
                    sx={{
                      mt: 1,
                      color: "#666",
                      lineHeight: 1.4,
                      fontWeight: 400,
                    }}
                  >
                    {requirement.name}
                  </Typography>
                )}
              </Stack>
              <StatusDropdown
                currentStatus={requirement.status ?? "Not started"}
                onStatusChange={(newStatus) =>
                  handleStatusUpdate(newStatus, requirement, topicIndex, index)
                }
                size="small"
                allowedRoles={allowedRoles.frameworks.edit}
                userRole={userRoleName}
              />
            </Stack>
          ))
        ) : (
          <Stack sx={styles.noSubClausesContainer}>
            No matching requirements
          </Stack>
        )}
      </AccordionDetails>
    );
  }

  // Filter topics based on search term
  const filteredTopics = useMemo(() => {
    if (!searchTerm.trim()) {
      return topics;
    }
    return topics.filter((topic: any) =>
      topic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.topic_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.requirements?.some((req: any) =>
        req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requirement_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [topics, searchTerm]);

  if (loading) {
    return (
      <Stack sx={{ ...styles.loadingContainer, py: 8 }}>
        <CircularProgress size={24} />
        <Typography sx={{ mt: 2, color: "#666" }}>
          Loading Law-25 requirements...
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack className="law-25-requirements" spacing={0}>
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
      <Typography
        sx={{
          ...styles.title,
          mt: 4,
          mb: 3,
          fontSize: 15,
          fontWeight: 600,
          color: "#1a1a1a",
        }}
      >
        Quebec Law 25 - Compliance requirements
      </Typography>
      {onStatusFilterChange && statusOptions && (
        <TabFilterBar
          statusFilter={statusFilter || ""}
          onStatusChange={onStatusFilterChange}
          showStatusFilter={true}
          statusOptions={statusOptions}
          showSearchBar={true}
          searchTerm={searchTerm}
          setSearchTerm={onSearchTermChange as any}
        />
      )}
      {filteredTopics &&
        filteredTopics.map((topic: any, topicIndex: number) => (
          <Stack key={topic.id} sx={{ ...styles.container, marginBottom: "2px" }}>
            <Accordion
              key={topic.id}
              expanded={expanded === topic.id}
              sx={styles.accordion}
              onChange={handleAccordionChange(topic.id ?? 0)}
            >
              <AccordionSummary
                sx={{
                  ...styles.accordionSummary,
                  minHeight: 64,
                  "& .MuiAccordionSummary-content": {
                    margin: "16px 0",
                    "&.Mui-expanded": {
                      margin: "20px 0",
                    },
                  },
                }}
              >
                <RightArrowBlack
                  size={16}
                  style={
                    styles.expandIcon(
                      expanded === topic.id
                    ) as React.CSSProperties
                  }
                />
                <Stack sx={{ paddingLeft: "2.5px", flex: 1 }}>
                  <Typography
                    fontSize={13}
                    fontWeight={600}
                    color="#1a1a1a"
                    sx={{ lineHeight: 1.3 }}
                  >
                    Chapter {topic.order_no}: {topic.name}
                  </Typography>
                  <Typography
                    fontSize={12}
                    sx={{
                      mt: 0.5,
                      color: "#666",
                      fontWeight: 400,
                    }}
                  >
                    {topic.requirements?.length || 0} requirements
                  </Typography>
                </Stack>
              </AccordionSummary>
              {renderRequirements(topic, topicIndex)}
            </Accordion>
          </Stack>
        ))}

      {filteredTopics.length === 0 && !loading && (
        <Stack sx={{ py: 4, textAlign: "center" }}>
          <Typography color="#666">
            No topics found matching your search criteria.
          </Typography>
        </Stack>
      )}

      {/* Law-25 Requirement Details Drawer */}
      <Law25DrawerDialog
        open={drawerOpen}
        onClose={handleDrawerClose}
        onSaveSuccess={handleDrawerSaveSuccess}
        requirement={selectedRequirement}
        topic={selectedTopic}
        projectFrameworkId={projectFrameworkId}
      />
    </Stack>
  );
};

export default Law25Requirements;
