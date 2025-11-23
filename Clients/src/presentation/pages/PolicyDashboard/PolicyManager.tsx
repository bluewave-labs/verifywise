import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Stack, SelectChangeEvent } from "@mui/material";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";
import PolicyTable from "../../components/Policies/PolicyTable";
import PolicyDetailModal from "../../components/Policies/PolicyDetailsModal";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { deletePolicy } from "../../../application/repository/policy.repository";
import EmptyState from "../../components/EmptyState";
import Select from "../../components/Inputs/Select";
import { SearchBox } from "../../components/Search";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { AlertProps } from "../../../domain/interfaces/iAlert";
import { PolicyManagerModel } from "../../../domain/models/Common/policy/policyManager.model";
import { PolicyManagerProps } from "../../../domain/interfaces/IPolicy";
import PolicyStatusCard from "./PolicyStatusCard";
import { ExportMenu } from "../../components/Table/ExportMenu";
import useUsers from "../../../application/hooks/useUsers";

const PolicyManager: React.FC<PolicyManagerProps> = ({
  policies: policyList,
  tags,
  fetchAll,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<PolicyManagerModel[]>([]);

  useEffect(() => {
    setPolicies(policyList);
  }, [policyList]);

  const [selectedPolicy, setSelectedPolicy] =
    useState<PolicyManagerModel | null>(null);
  const [showModal, setShowModal] = useState(false);

  // New state for filter + search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState<AlertProps | null>(null);

  // Auto-open create policy modal when navigating from "Add new..." dropdown
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setSelectedPolicy(null);
      setShowModal(true);

      // Clear the navigation state to prevent re-opening on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleOpen = (id?: number) => {
    if (!id) {
      setSelectedPolicy(null); // Ensure selectedPolicy is null for new policy
      setShowModal(true); // Open modal
    } else {
      const p = policies.find((x) => x.id === id) || null;
      setSelectedPolicy(p);
      setShowModal(true); // Open modal with selected policy
    }
  };

  const handleAddNewPolicy = () => {
    handleOpen();
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSaved = (successMessage?: string) => {
    fetchAll();
    handleClose();

    // Show success alert if message is provided
    if (successMessage) {
      handleAlert({
        variant: "success",
        body: successMessage,
        setAlert,
        alertTimeout: 4000, // 4 seconds to give users time to read
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePolicy(id);
      setPolicies((prev) => prev.filter((policy) => policy.id !== id));

      // Show success alert using VerifyWise standard pattern
      handleAlert({
        variant: "success",
        body: "Policy deleted successfully!",
        setAlert,
        alertTimeout: 4000, // 4 seconds to give users time to read
      });
    } catch (err) {
      console.error(err);

      // Show error alert for failed deletion
      handleAlert({
        variant: "error",
        body: "Failed to delete policy. Please try again.",
        setAlert,
        alertTimeout: 4000,
      });
    }
  };

  // ✅ Status options (same as PolicyStatusCard)
  const statusOptions = [
    { _id: "all", name: "All Policies" },
    { _id: "Draft", name: "Draft" },
    { _id: "Under Review", name: "Under Review" },
    { _id: "Approved", name: "Approved" },
    { _id: "Published", name: "Published" },
    { _id: "Archived", name: "Archived" },
    { _id: "Deprecated", name: "Deprecated" },
  ];

  // ✅ Filter + search
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter;
      const matchesSearch = p.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [policies, statusFilter, searchTerm]);

  const { users } = useUsers();

  // Define export columns for policy table
  const exportColumns = useMemo(() => {
    return [
      { id: 'title', label: 'Title' },
      { id: 'status', label: 'Status' },
      { id: 'tags', label: 'Tags' },
      { id: 'next_review', label: 'Next Review' },
      { id: 'author', label: 'Author' },
      { id: 'last_updated', label: 'Last Updated' },
      { id: 'updated_by', label: 'Updated By' },
    ];
  }, []);

  // Prepare export data - format the data for export
  const exportData = useMemo(() => {
    return filteredPolicies.map((policy: PolicyManagerModel) => {
      const authorUser = users.find((user) => user.id === policy.author_id);
      const authorName = authorUser ? `${authorUser.name} ${authorUser.surname}` : '-';

      const updatedByUser = users.find((user) => user.id === policy.last_updated_by);
      const updatedByName = updatedByUser ? `${updatedByUser.name} ${updatedByUser.surname}` : '-';

      return {
        title: policy.title || '-',
        status: policy.status || '-',
        tags: policy.tags?.join(', ') || '-',
        next_review: policy.next_review_date ? new Date(policy.next_review_date).toLocaleDateString() : '-',
        author: authorName,
        last_updated: policy.last_updated_at ? new Date(policy.last_updated_at).toLocaleString() : '-',
        updated_by: updatedByName,
      };
    });
  }, [filteredPolicies, users]);

  return (
    <Stack className="vwhome" gap={"16px"}>
      {/* Policy by Status Cards */}
      <Box data-joyride-id="policy-status-cards">
        <PolicyStatusCard policies={policies} />
      </Box>

      {/* Filter + Search + Add Button row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={4}
        sx={{ width: "100%" }}
      >
        {/* Left side: Dropdown + Search together */}
        <Stack direction="row" spacing={6} alignItems="center">
          {/* Dropdown Filter */}
          <div data-joyride-id="policy-status-filter">
            <Select
              id="policy-status"
              value={statusFilter}
              items={statusOptions}
              onChange={(e: SelectChangeEvent<string | number>) =>
                setStatusFilter(`${e.target.value}`)
              }
              sx={{
                minWidth: "180px",
                height: "34px",
                bgcolor: "#fff",
              }}
            />
          </div>

          {/* Search */}
          <Box sx={{ width: 300 }} data-joyride-id="policy-search">
            <SearchBox
              placeholder="Search policies..."
              value={searchTerm}
              onChange={setSearchTerm}
              inputProps={{ "aria-label": "Search policies" }}
            />
          </Box>
        </Stack>

        {/* Right side: Export and Add Button */}
        <Stack direction="row" gap="8px" alignItems="center">
          <ExportMenu
            data={exportData}
            columns={exportColumns}
            filename="policy-manager"
            title="Policy Manager"
          />
          <Box data-joyride-id="add-policy-button">
            <CustomizableButton
              variant="contained"
              text="Add new policy"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
              gap: 3,
            }}
            icon={<AddCircleOutlineIcon size={16} />}
            onClick={handleAddNewPolicy}
          />
          </Box>
        </Stack>
      </Stack>

      {/* Table / Empty state */}
      <Box sx={{ mt: 1 }}>
        {filteredPolicies.length === 0 ? (
          <EmptyState
            message={
              searchTerm
                ? "No matching policies found." // Search active
                : statusFilter !== "all"
                ? "No matching policies found." // Status filter active
                : "There is currently no data in this table." // Table empty
            }
            imageAlt="No policies available"
          />
        ) : (
          <PolicyTable
            data={filteredPolicies}
            onOpen={handleOpen}
            onDelete={handleDelete}
          />
        )}
      </Box>

      {/* Modal */}
      {showModal && tags.length > 0 && (
        <PolicyDetailModal
          policy={selectedPolicy}
          tags={tags}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast={true}
          onClick={() => setAlert(null)}
        />
      )}
    </Stack>
  );
};

export default PolicyManager;
