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
import SearchIcon from "@mui/icons-material/Search";
import { vwhomeHeading } from "../Home/1.0Home/style";
import singleTheme from "../../themes/v1SingleTheme";
import CustomizableButton from "../../components/Button/CustomizableButton";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
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
    <div>
      <Stack sx={{ gap: "15px" }}>
        <PageBreadcrumbs />
        <HelperDrawer
          isOpen={isHelperDrawerOpen}
          onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
          helpContent="<h3>Policy Manager</h3><p>Policy Manager lets you create and update company AI policies in one place to stay compliant and consistent.</p><h3>Features</h3><ul><li>Create new AI policies</li><li>Edit existing policies</li><li>Organize policies with tags</li><li>Maintain compliance standards</li></ul>"
          pageTitle="Policy Manager"
        />
        <Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={vwhomeHeading}>Policy Manager</Typography>
            <HelperIcon
              onClick={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
              size="small"
            />
          </Stack>
          <Typography sx={singleTheme.textStyles.pageDescription}>
            Policy Manager lets you create and update company AI policies in one
            place to stay compliant and consistent.
          </Typography>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="flex-end" // ✅ bottom alignment
        mb={8}
        mt={10}
        gap={4}
      >
        {/* Policy by Status Cards */}
        {policies.length > 0 && (
          <Box sx={{ flex: 1 }}>
            <PolicyStatusCard policies={policies} />
          </Box>
        )}

        {/* Add New Policy Button */}
        <CustomizableButton
          variant="contained"
          text="Add new policy"
          sx={{
            backgroundColor: "#13715B",
            border: "1px solid #13715B",
            gap: 3,
            height: "fit-content", // ✅ keeps button compact
          }}
          icon={<AddCircleOutlineIcon />}
          onClick={handleAddNewPolicy}
        />
      </Stack>

          {/* Filter + Search row */}
          <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={4}
              alignItems="center"
              mb={8}
          >
              {/* Dropdown Filter */}
              <Select
                  id="policy-status"
                  value={statusFilter}
                  items={statusOptions}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  sx={{
                      minWidth: "180px",
                      height: "40px",
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

          {/* Table / Empty state */}
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

          {/* Modal */}
          {showModal && tags.length > 0 && (
              <PolicyDetailModal
                  policy={selectedPolicy}
                  tags={tags}
                  onClose={handleClose}
                  onSaved={handleSaved}
              />
          )}
      </div>
  );
};

export default PolicyDashboard;
