import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PolicyTable from "../../components/Policies/PolicyTable";
import PolicyDetailModal from "../../components/Policies/PolicyDetailsModal";
import {
  Box,
  Stack,
  IconButton,
  InputBase,
  SelectChangeEvent,
} from "@mui/material";
import { Search as SearchIcon } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import PageTour from "../../components/PageTour";
import PolicySteps from "./PolicySteps";
import {
  deletePolicy,
  getAllPolicies,
  getAllTags,
} from "../../../application/repository/policy.repository";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import EmptyState from "../../components/EmptyState";
import PolicyStatusCard from "./PolicyStatusCard";
import { searchBoxStyle, inputStyle } from "./style";
import Select from "../../components/Inputs/Select";
import PageHeader from "../../components/Layout/PageHeader";
import { handleAlert } from "../../../application/tools/alertUtils";
import Alert from "../../components/Alert";
import { AlertProps } from "../../../domain/interfaces/iAlert";
import { PolicyManagerModel } from "../../../domain/models/Common/policy/policyManager.model";

const PolicyDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<PolicyManagerModel[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyManagerModel | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  // New state for filter + search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(true);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const fetchAll = async () => {
    const [pRes, tRes] = await Promise.all([getAllPolicies(), getAllTags()]);
    setPolicies(pRes);
    setTags(tRes);
    setIsInitialLoadComplete(true);
  };

  useEffect(() => {
    fetchAll();
  }, []);

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

  const handleClose = () => setShowModal(false);

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

  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />
        <HelperDrawer
          open={isHelperDrawerOpen}
          onClose={() => setIsHelperDrawerOpen(false)}
          title="Policy manager"
          description="Create and maintain AI governance policies aligned with regulatory requirements"
          whatItDoes="Centralize *policy creation*, *version control*, and *distribution* for all *AI-related governance documentation*. Track *policy reviews*, *approvals*, and *acknowledgments* across your organization."
          whyItMatters="**Well-documented policies** are the foundation of effective *AI governance*. They demonstrate your commitment to *responsible AI*, ensure *consistent practices* across teams, and satisfy *regulatory requirements* for documented controls."
          quickActions={[
            {
              label: "Create New Policy",
              description: "Draft governance policies using templates and best practices",
              primary: true
            },
            {
              label: "Review Policy Status",
              description: "Check approval status and track policy acknowledgments"
            }
          ]}
          useCases={[
            "*AI ethics policies* defining *acceptable use* and *development principles*",
            "*Data governance policies* for handling *sensitive information* in *AI systems*"
          ]}
          keyFeatures={[
            "**Policy lifecycle management** from *draft* through *approval* to *retirement*",
            "*Version control* with *change tracking* and *approval workflows*",
            "*Distribution tracking* to ensure all *stakeholders* have *acknowledged current policies*"
          ]}
          tips={[
            "Start with *template policies* and customize them to your *organization's needs*",
            "Schedule *regular policy reviews* to ensure they remain *current and relevant*",
            "Track *acknowledgments* to demonstrate *policy awareness* across your teams"
          ]}
        />

        <PageHeader
          title="Policy manager"
          description="Policy Manager lets you create and update company AI policies in one
               place to stay compliant and consistent."
          rightContent={
            <HelperIcon
              onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
              size="small"
            />
          }
        />

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
                onChange={(e: SelectChangeEvent<string | number>) => setStatusFilter(`${e.target.value}`)}
                sx={{
                  minWidth: "180px",
                  height: "34px",
                  bgcolor: "#fff",
                }}
              />
            </div>

            {/* Expandable Search */}
            <Box sx={searchBoxStyle(isSearchBarVisible)} data-joyride-id="policy-search">
              <IconButton
                disableRipple
                disableFocusRipple
                sx={{ "&:hover": { backgroundColor: "transparent" } }}
                aria-label="Toggle policy search"
                aria-expanded={isSearchBarVisible}
                onClick={() => setIsSearchBarVisible((prev) => !prev)}
              >
                <SearchIcon size={16} />
              </IconButton>

              {isSearchBarVisible && (
                <InputBase
                  autoFocus
                  placeholder="Search policies..."
                  inputProps={{ "aria-label": "Search policies" }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={inputStyle(isSearchBarVisible)}
                />
              )}
            </Box>
          </Stack>

          {/* Right side: Add New Policy Button */}
          <Box data-joyride-id="add-policy-button">
            <CustomizableButton
              variant="contained"
              text="Add new policy"
              sx={{
                backgroundColor: "#13715B",
                border: "1px solid #13715B",
                gap: 3,
                height: "fit-content",
              }}
              icon={<AddCircleOutlineIcon size={16} />}
              onClick={handleAddNewPolicy}
            />
          </Box>
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

      <PageTour steps={PolicySteps} run={isInitialLoadComplete} tourKey="policy-tour" />
    </Stack>
  );
};

export default PolicyDashboard;
