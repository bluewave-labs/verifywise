import React, { useEffect, useState, useMemo } from "react";
import PolicyTable from "../../components/Policies/PolicyTable";
import PolicyDetailModal from "../../components/Policies/PolicyDetailsModal";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  InputBase,
  useTheme,
} from "@mui/material";
import { ReactComponent as SearchIcon } from "../../assets/icons/search.svg";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import policyManagerHelpContent from "../../../presentation/helpers/policy-manager-help.html?raw";
import {
  deletePolicy,
  getAllPolicies,
  getAllTags,
} from "../../../application/repository/policy.repository";
import { Policy } from "../../../domain/types/Policy";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import placeholderImage from "../../assets/imgs/empty-state.svg";
import {
  emptyStateContainerStyle,
  emptyStateTextStyle,
} from "../ModelInventory/style";
import PolicyStatusCard from "./PolicyStatusCard";
import { searchBoxStyle, inputStyle } from "./style";
import Select from "../../components/Inputs/Select";
import PageHeader from "../../components/Layout/PageHeader";

const PolicyDashboard: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  // New state for filter + search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);

  const theme = useTheme();

  const fetchAll = async () => {
    const [pRes, tRes] = await Promise.all([getAllPolicies(), getAllTags()]);
    setPolicies(pRes);
    setTags(tRes);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleOpen = (id?: string) => {
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

  const handleSaved = () => {
    fetchAll();
    handleClose();
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePolicy(id);
      setPolicies((prev) => prev.filter((policy) => policy.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ Status options (same as PolicyStatusCard)
  const statusOptions = [
    { _id: "all", name: "All Policies" },
    { _id: "Draft", name: "Draft" },
    { _id: "In review", name: "In Review" },
    { _id: "Approved", name: "Approved" },
    { _id: "Published", name: "Published" },
    { _id: "Archived", name: "Archived" },
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
          isOpen={isHelperDrawerOpen}
          onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
          helpContent={policyManagerHelpContent}
          pageTitle="Policy Manager"
        />

        <PageHeader
          title="Policy Manager"
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
        {policies.length > 0 && (
          <Box>
            <PolicyStatusCard policies={policies} />
          </Box>
        )}

        {/* Filter + Search + Add Button row */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={4}
          sx={{ width: "100%" }}
        >
          {/* Left side: Dropdown + Search together */}
          <Stack direction="row" spacing={4} alignItems="center">
            {/* Dropdown Filter */}
            <Select
              id="policy-status"
              value={statusFilter}
              items={statusOptions}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              sx={{
                minWidth: "180px",
                height: "34px",
                bgcolor: "#fff",
              }}
            />

            {/* Expandable Search */}
            <Box sx={searchBoxStyle(isSearchBarVisible)}>
              <IconButton
                disableRipple
                disableFocusRipple
                sx={{ "&:hover": { backgroundColor: "transparent" } }}
                aria-label="Toggle policy search"
                aria-expanded={isSearchBarVisible}
                onClick={() => setIsSearchBarVisible((prev) => !prev)}
              >
                <SearchIcon />
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
          <CustomizableButton
            variant="contained"
            text="Add new policy"
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              gap: 3,
              height: "fit-content",
            }}
            icon={<AddCircleOutlineIcon />}
            onClick={handleAddNewPolicy}
          />
        </Stack>

      {/* Table / Empty state */}
      <Box sx={{ mt: 1 }}>
        {filteredPolicies.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={emptyStateContainerStyle(theme)}
          >
            <img src={placeholderImage} alt="Placeholder" />
            <Typography sx={emptyStateTextStyle}>
              {
                searchTerm
                  ? "No matching policies found." // Search active
                  : statusFilter !== "all"
                  ? "No matching policies found." // Status filter active
                  : "There is currently no data in this table." // Table empty
              }
            </Typography>
          </Stack>
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
    </Stack>
  );
};

export default PolicyDashboard;
