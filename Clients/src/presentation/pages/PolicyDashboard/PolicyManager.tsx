import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";
import PolicyTable from "../../components/Policies/PolicyTable";
import PolicyDetailModal from "../../components/Policies/PolicyDetailsModal";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { deletePolicy } from "../../../application/repository/policy.repository";
import EmptyState from "../../components/EmptyState";
import { SearchBox } from "../../components/Search";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { AlertProps } from "../../types/alert.types";
import { PolicyManagerModel } from "../../../domain/models/Common/policy/policyManager.model";
import { PolicyManagerProps } from "../../types/interfaces/i.policy";
import PolicyStatusCard from "./PolicyStatusCard";
import { ExportMenu } from "../../components/Table/ExportMenu";
import useUsers from "../../../application/hooks/useUsers";
import { GroupBy } from "../../components/Table/GroupBy";
import { useTableGrouping, useGroupByState } from "../../../application/hooks/useTableGrouping";
import { GroupedTableView } from "../../components/Table/GroupedTableView";
import { FilterBy, FilterColumn } from "../../components/Table/FilterBy";
import { useFilterBy } from "../../../application/hooks/useFilterBy";
import LinkedPolicyModal from "../../components/Policies/LinkedPolicyModal";

const PolicyManager: React.FC<PolicyManagerProps> = ({
  policies: policyList,
  tags,
  fetchAll,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessedUrlParam = useRef(false);
  const [policies, setPolicies] = useState<PolicyManagerModel[]>([]);

  const [showLinkedObjectModal, setLinkedObjectsModalOpen] =  useState(false);
  const [policyId, setSelectedPolicyId] = useState<number | null>(null);

  useEffect(() => {
    setPolicies(policyList);
  }, [policyList]);

  const [selectedPolicy, setSelectedPolicy] =
    useState<PolicyManagerModel | null>(null);
  const [showModal, setShowModal] = useState(false);

  // New state for filter + search
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState<AlertProps | null>(null);

  // GroupBy state
  const { groupBy, groupSortOrder, handleGroupChange } = useGroupByState();

  // Auto-open create policy modal when navigating from "Add new..." dropdown
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setSelectedPolicy(null);
      setShowModal(true);

      // Clear the navigation state to prevent re-opening on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleOpen = useCallback((id?: number) => {
    if (!id) {
      setSelectedPolicy(null); // Ensure selectedPolicy is null for new policy
      setShowModal(true); // Open modal
    } else {
      const p = policies.find((x) => x.id === id) || null;
      setSelectedPolicy(p);
      setShowModal(true); // Open modal with selected policy
    }
  }, [policies]);

  // Handle policyId URL param to open edit modal from Wise Search
  useEffect(() => {
    const policyId = searchParams.get("policyId");
    if (policyId && !hasProcessedUrlParam.current && policies.length > 0) {
      hasProcessedUrlParam.current = true;
      // Use existing handleOpen function which sets selectedPolicy and opens modal
      handleOpen(parseInt(policyId, 10));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, policies, setSearchParams, handleOpen]);

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

  const handleLinkedObject = async (id: number) => {
    try {
       setSelectedPolicyId(id);
       setLinkedObjectsModalOpen(true);
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
  }

  const handleCloseLinkedObjects = () => {
    setLinkedObjectsModalOpen(false);
  };

  const { users } = useUsers();

  // FilterBy - Dynamic options generators
  const getUniqueAuthors = useCallback(() => {
    const authorIds = new Set<string>();
    policies.forEach((policy) => {
      if (policy.author_id) {
        authorIds.add(policy.author_id.toString());
      }
    });
    return Array.from(authorIds)
      .map((authorId) => {
        const user = users.find((u) => u.id.toString() === authorId);
        const userName = user ? `${user.name} ${user.surname}`.trim() : `User ${authorId}`;
        return { value: authorId, label: userName };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [policies, users]);

  // FilterBy - Filter columns configuration
  const policyFilterColumns: FilterColumn[] = useMemo(() => [
    {
      id: 'title',
      label: 'Title',
      type: 'text' as const,
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'Draft', label: 'Draft' },
        { value: 'Under Review', label: 'Under review' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Published', label: 'Published' },
        { value: 'Archived', label: 'Archived' },
        { value: 'Deprecated', label: 'Deprecated' },
      ],
    },
    {
      id: 'author_id',
      label: 'Author',
      type: 'select' as const,
      options: getUniqueAuthors(),
    },
    {
      id: 'next_review_date',
      label: 'Next review date',
      type: 'date' as const,
    },
  ], [getUniqueAuthors]);

  // FilterBy - Field value getter
  const getPolicyFieldValue = useCallback(
    (item: PolicyManagerModel, fieldId: string): string | number | Date | null | undefined => {
      switch (fieldId) {
        case 'title':
          return item.title;
        case 'status':
          return item.status;
        case 'author_id':
          return item.author_id?.toString();
        case 'next_review_date':
          return item.next_review_date;
        default:
          return null;
      }
    },
    []
  );

  // FilterBy - Initialize hook
  const { filterData: filterPolicyData, handleFilterChange: handlePolicyFilterChange } = useFilterBy<PolicyManagerModel>(getPolicyFieldValue);

  // ✅ Filter + search using FilterBy
  const filteredPolicies = useMemo(() => {
    let result = filterPolicyData(policies);

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(query)
      );
    }

    return result;
  }, [filterPolicyData, policies, searchTerm]);

  // Define how to get the group key for each policy
  const getPolicyGroupKey = useCallback((policy: PolicyManagerModel, field: string): string => {
    switch (field) {
      case 'status':
        return policy.status || 'Unknown';
      case 'author':
        if (policy.author_id) {
          const user = users.find((u) => u.id === policy.author_id);
          return user ? `${user.name} ${user.surname}`.trim() : 'Unknown';
        }
        return 'Unknown';
      default:
        return 'Other';
    }
  }, [users]);

  // Apply grouping to filtered policies
  const groupedPolicies = useTableGrouping({
    data: filteredPolicies,
    groupByField: groupBy,
    sortOrder: groupSortOrder,
    getGroupKey: getPolicyGroupKey,
  });

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
        {/* Left side: Filter + Group + Search together */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* FilterBy */}
          <div data-joyride-id="policy-status-filter">
            <FilterBy
              columns={policyFilterColumns}
              onFilterChange={handlePolicyFilterChange}
            />
          </div>

          {/* Group By */}
          <GroupBy
            options={[
              { id: 'status', label: 'Status' },
              { id: 'author', label: 'Author' },
            ]}
            onGroupChange={handleGroupChange}
          />

          {/* Search */}
          <Box data-joyride-id="policy-search">
            <SearchBox
              placeholder="Search policies..."
              value={searchTerm}
              onChange={setSearchTerm}
              inputProps={{ "aria-label": "Search policies" }}
              fullWidth={false}
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
                ? "No matching policies found."
                : "There is currently no data in this table."
            }
            imageAlt="No policies available"
          />
        ) : (
          <GroupedTableView
            groupedData={groupedPolicies}
            ungroupedData={filteredPolicies}
            renderTable={(data, options) => (
              <PolicyTable
                data={data}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onLinkedObjects={handleLinkedObject}
                hidePagination={options?.hidePagination}
              />
            )}
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

      {/* Modal */}
      {showLinkedObjectModal && (
      <LinkedPolicyModal
        onClose = {handleCloseLinkedObjects}
        policyId = {policyId}
        isOpen = {showLinkedObjectModal}
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
