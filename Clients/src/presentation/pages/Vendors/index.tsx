/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./index.css";
import {
  Box,
  SelectChangeEvent,
  Stack,
  useTheme,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder/index";
import RiskTable from "../../components/Table/RisksTable";
import { Suspense, useEffect, useState, useMemo } from "react";
import AddNewVendor from "../../components/Modals/NewVendor";
import { useSelector } from "react-redux";
import { extractUserToken } from "../../../application/tools/extractToken";
import { AppState } from "../../../application/interfaces/appStates";
import useUsers from "../../../application/hooks/useUsers";
import { tabPanelStyle } from "./style";
import { logEngine } from "../../../application/tools/log.engine";
import Alert from "../../components/Alert";
import PageTour from "../../components/PageTour";
import VendorsSteps from "./VendorsSteps";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import { CirclePlus as AddCircleOutlineIcon } from "lucide-react"
import AddNewRisk from "../../components/Modals/NewRisk";
import CustomizableButton from "../../components/Button/CustomizableButton";
import CustomizableSkeleton from "../../components/Skeletons";
import CustomizableToast from "../../components/Toast";
import RisksCard from "../../components/Cards/RisksCard";
import useVendorRisks from "../../../application/hooks/useVendorRisks";
import Select from "../../components/Inputs/Select";
import allowedRoles from "../../../application/constants/permissions";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import {
  useVendors,
  useDeleteVendor,
} from "../../../application/hooks/useVendors";
import { useProjects } from "../../../application/hooks/useProjects";
import { useDeleteVendorRisk } from "../../../application/hooks/useVendorRiskMutations";
import { getVendorById } from "../../../application/repository/vendor.repository";
import { getVendorRiskById } from "../../../application/repository/vendorRisk.repository";
import PageHeader from "../../components/Layout/PageHeader";
import { VendorModel } from "../../../domain/models/Common/vendor/vendor.model";
import { ExistingRisk } from "../../../domain/interfaces/i.vendor";
import TabBar from "../../components/TabBar";
import SearchBox from "../../components/Search/SearchBox";
import { ReviewStatus } from "../../../domain/enums/status.enum";

// Constants
const REDIRECT_DELAY_MS = 2000;

const Vendors = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authToken = useSelector((state: AppState) => state.auth.authToken);
  const userToken = extractUserToken(authToken);
  const userRoleName = userToken?.roleName || "";
  const { users } = useUsers();

  const [selectedVendor, setSelectedVendor] = useState<VendorModel| null>(null);
  const [selectedRisk, setSelectedRisk] = useState<ExistingRisk | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<'active' | 'deleted' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const currentPath = location.pathname;
  const isRisksTab = currentPath.includes("/vendors/risks");
  const value = isRisksTab ? "2" : "1";


  // TanStack Query hooks
  const { data: projects = [] } = useProjects();
  const { data: vendors = [], isLoading: isVendorsLoading, refetch: refetchVendors } = useVendors({
    projectId: selectedProjectId,
  });
  const {
    vendorRisksSummary,
    refetchVendorRisks,
    vendorRisks,
    loadingVendorRisks,
  } = useVendorRisks({
    projectId: selectedProjectId?.toString(),
    vendorId: selectedVendorId?.toString(),
    filter: filterStatus,
  });

  // Mutation hooks
  const deleteVendorMutation = useDeleteVendor();
  const deleteVendorRiskMutation = useDeleteVendorRisk();

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const [runVendorTour, setRunVendorTour] = useState(false);
  const { refs, allVisible } = useMultipleOnScreen<HTMLDivElement>({
    countToTrigger: 1,
  });

  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const isCreatingDisabled =
    !allowedRoles.vendors.create.includes(userRoleName) ||
    projects.length === 0;
  const isDeletingAllowed = allowedRoles.vendors.delete.includes(userRoleName);

  const openAddNewVendor = () => {
    setIsOpen(true);
  };
  const handleRiskModal = () => {
    setIsRiskModalOpen((prev) => !prev);
  };

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    if (newValue === "1") {
      navigate("/vendors");
    } else if (newValue === "2") {
      navigate("/vendors/risks");
    }
  };

  useEffect(() => {
    if (allVisible) {
      setRunVendorTour(true);
    }
  }, [allVisible]);

  // Auto-open create vendor modal when navigating from "Add new..." dropdown
  useEffect(() => {
    if (location.state?.openCreateModal && !isVendorsLoading) {
      // Check if we're on the risks tab
      if (isRisksTab) {
        // Check if there are any vendors
        if (vendors.length === 0) {
          setAlert({
            variant: "info",
            title: "No vendors available",
            body: "Please create a vendor first before adding vendor risks. Redirecting to vendors tab...",
          });
          // Redirect to vendors tab
          setTimeout(() => {
            navigate("/vendors");
            setIsOpen(true);
            setSelectedVendor(null);
          }, REDIRECT_DELAY_MS);
        } else {
          setIsRiskModalOpen(true);
        }
      } else {
        setIsOpen(true);
        setSelectedVendor(null);
      }

      // Clear the navigation state to prevent re-opening on subsequent navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Dependencies: location.state triggers the effect when openCreateModal is passed via navigation
    // navigate, location.pathname are needed for state clearing
    // isRisksTab, vendors.length, isVendorsLoading determine which modal to open or if validation is needed
  }, [location.state, navigate, location.pathname, isRisksTab, vendors.length, isVendorsLoading]);

  const handleDeleteVendor = async (vendorId?: number) => {
    if (!vendorId) {
      logEngine({
        type: "error",
        message: "No ID provided for fetching vendor data.",
      });
      setAlert({
        variant: "error",
        body: "No ID provided for fetching vendor data.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await deleteVendorMutation.mutateAsync(vendorId);

      if (response.status === 202) {
        setAlert({
          variant: "success",
          body: "Vendor deleted successfully.",
        });
        setTimeout(() => {
          setAlert(null);
        }, 3000);
        await refetchVendorRisks();
      } else if (response.status === 404) {
        setAlert({
          variant: "error",
          body: "Vendor not found.",
        });
        setTimeout(() => {
          setAlert(null);
        }, 3000);
      } else {
        console.error("Unexpected response. Please try again.");
        logEngine({
          type: "error",
          message: "Unexpected response. Please try again.",
        });
        setAlert({
          variant: "error",
          body: "Unexpected error. Please try again.",
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      logEngine({
        type: "error",
        message: `An error occurred: ${error}`,
      });
      setAlert({
        variant: "error",
        body: "Failed to delete vendor. It may have already been deleted or there was a network error.",
      });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRisk = async (riskId: number | undefined) => {
    if (!riskId) {
      setAlert({
        variant: "error",
        body: "Invalid risk ID. Please refresh the page.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await deleteVendorRiskMutation.mutateAsync(riskId);

      if (response.status === 202) {
        setAlert({
          variant: "success",
          body: "Risk deleted successfully.",
        });
        setTimeout(() => {
          setAlert(null);
        }, 3000);
        await refetchVendorRisks();
      } else if (response.status === 404) {
        setAlert({
          variant: "error",
          body: "Risk not found.",
        });
        setTimeout(() => setAlert(null), 3000);
      } else {
        console.error("Unexpected response. Please try again.");
        logEngine({
          type: "error",
          message: "Unexpected response. Please try again.",
        });
        setAlert({
          variant: "error",
          body: "Unexpected error. Please try again.",
        });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting Risk:", error);
      logEngine({
        type: "error",
        message: `An error occurred: ${error}`,
      });
      setAlert({
        variant: "error",
        body: "Failed to delete risk. It may have already been deleted or there was a network error.",
      });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRisk = async (riskId: number | undefined) => {
    if (!riskId) {
      setAlert({
        variant: "error",
        body: "Invalid risk ID. Please refresh the page.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    try {
      const response = await getVendorRiskById({
        id: Number(riskId),
      });
      setSelectedRisk(response.data);
      setIsRiskModalOpen(true);
    } catch (e) {
      logEngine({
        type: "error",
        message: "Failed to update risk data.",
      });
      setAlert({
        variant: "error",
        body: "Could not fetch risk data.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleEditVendor = async (id?: number) => {
    if (!id) {
      logEngine({
        type: "error",
        message: "No ID provided for fetching vendor data.",
      });
      setAlert({
        variant: "error",
        body: "No ID provided for fetching vendor data.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    try {
      const response = await getVendorById({
        id: Number(id),
      });
      setSelectedVendor(response.data);
      setIsOpen(true);
    } catch (e) {
      logEngine({
        type: "error",
        message: "Failed to fetch vendor data.",
      });
      setAlert({
        variant: "error",
        body: "Could not fetch vendor data.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleProjectChange = (
    event: SelectChangeEvent<string | number>,
    _child: React.ReactNode
  ) => {
    const selectedId = event.target.value.toString();
    setSelectedProjectId(selectedId);
  };

  const handleVendorChange = (
    event: SelectChangeEvent<string | number>,
    _child: React.ReactNode
  ) => {
    const selectedId = event.target.value.toString();
    setSelectedVendorId(selectedId);
  };

  const handleFilterStatusChange = (
    event: SelectChangeEvent<string | number>,
    _child: React.ReactNode
  ) => {
    const status = event.target.value as 'active' | 'deleted' | 'all';
    setFilterStatus(status);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleStatusFilterChange = (
    event: SelectChangeEvent<string | number>,
    _child: React.ReactNode
  ) => {
    const status = event.target.value as string;
    setStatusFilter(status);
  };

  // Get unique vendors from vendor risks data
  const vendorOptions = useMemo(() => {
    const uniqueVendors = new Map();

    // Add vendors from vendorRisks
    vendorRisks.forEach((risk) => {
      if (!uniqueVendors.has(risk.vendor_id)) {
        uniqueVendors.set(risk.vendor_id, {
          id: risk.vendor_id,
          name: risk.vendor_name,
          project_id: risk.project_id,
        });
      }
    });

    // Add vendors from local state that don't have risks
    vendors.forEach((vendor: any) => {
      if (!uniqueVendors.has(vendor.id)) {
        uniqueVendors.set(vendor.id, {
          id: vendor.id,
          name: vendor.vendor_name,
          project_id:
            vendor.projects && vendor.projects.length > 0
              ? vendor.projects[0]
              : null, // Safely access first project
        });
      }
    });

    const vendorList = Array.from(uniqueVendors.values());
    if (!selectedProjectId || selectedProjectId === "all") {
      return vendorList;
    }
    return vendorList.filter(
      (vendor) =>
        vendor.project_id && vendor.project_id.toString() === selectedProjectId
    );
  }, [vendorRisks, selectedProjectId, vendors]);

  useEffect(() => {
    // If the selected vendor is not in the new vendor options, reset to "all"
    if (
      selectedVendorId !== "all" &&
      !vendorOptions.some((vendor) => vendor.id.toString() === selectedVendorId)
    ) {
      setSelectedVendorId("all");
    }
  }, [selectedProjectId, vendorOptions, selectedVendorId]);

  // Filter vendors based on search query and status
  const filteredVendors = useMemo(() => {
    let filtered = [...vendors];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((vendor: VendorModel) =>
        vendor.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.vendor_provides.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.vendor_contact_person.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((vendor: VendorModel) => {
        if (statusFilter === "not_started") return vendor.review_status === ReviewStatus.NotStarted;
        if (statusFilter === "in_review") return vendor.review_status === ReviewStatus.InReview;
        if (statusFilter === "reviewed") return vendor.review_status === ReviewStatus.Reviewed;
        if (statusFilter === "requires_follow_up") return vendor.review_status === ReviewStatus.RequiresFollowUp;
        return true;
      });
    }

    return filtered;
  }, [vendors, searchQuery, statusFilter]);

  return (
    <Stack className="vwhome" gap={0}>
      <PageBreadcrumbs />
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Vendor management"
        description="Manage your AI vendors and their associated risks"
        whatItDoes="Track and manage *external entities* that provide AI-related products, services, or components to your organization. Monitor their *compliance status* and assess *associated risks*."
        whyItMatters="**Vendor management** is crucial for maintaining *supply chain security*, ensuring *compliance*, and mitigating *third-party risks* in your AI ecosystem."
        quickActions={[
          {
            label: "Add Your First Vendor",
            description: "Start by adding a key AI vendor to track their services and compliance",
            primary: true,
            action: () => {
              setIsHelperDrawerOpen(false);
              setIsOpen(true);
            }
          },
          {
            label: "Add Vendor Risk",
            description: "Quickly assess vendor risks using our pre-built risk templates",
            action: () => {
              setIsHelperDrawerOpen(false);
              setIsRiskModalOpen(true);
            }
          }
        ]}
        useCases={[
          "*AI model vendors* providing machine learning algorithms and *pre-trained models*",
          "*Cloud AI platforms* offering infrastructure and *development environments*",
          "*Data processing services* handling *sensitive or regulated information*",
          "*Third-party analytics tools* integrated with your AI systems"
        ]}
        keyFeatures={[
          "**Centralized vendor database** with basic vendor information and contact details",
          "*Vendor risk management* with description, severity, likelihood, and action planning",
          "*Project-based filtering* to view vendors and risks by specific use cases",
          "*Dual-tab interface* for managing both vendors and their associated risks"
        ]}
        tips={[
          "Use the *project filter* to focus on vendors and risks for specific use cases",
          "Track *risk severity* and *likelihood* to understand which risks need attention",
          "Add *action plans* to vendor risks to document mitigation strategies",
          "Switch between *Vendors* and *Risks* tabs to manage different aspects of vendor oversight"
        ]}
      />
      <PageTour
        steps={VendorsSteps}
        run={runVendorTour}
        onFinish={() => {
          localStorage.setItem("vendor-tour", "true");
          setRunVendorTour(false);
        }}
        tourKey="vendor-tour"
      />
      <Stack gap={"16px"} maxWidth={1400}>
        {alert && (
          <Suspense fallback={<div>Loading...</div>}>
            <Alert
              variant={alert.variant}
              title={alert.title}
              body={alert.body}
              isToast={true}
              onClick={() => setAlert(null)}
            />
          </Suspense>
        )}

        <TabContext value={value}>
          <Box sx={{ mt: 4 }}>
            <PageHeader
              title={value === "1" ? "Vendor list" : "Vendor risks list"}
              description={value === "1"
                ? "This table includes a list of external entities that provide AI-related products, services, or components. You can create and manage all vendors here."
                : "This table includes a list of risks related to a vendor. You can create and manage all vendor risks here."
              }
              rightContent={value === "1" ? (
                <HelperIcon
                  onClick={() => setIsHelperDrawerOpen(true)}
                  size="small"
                />
              ) : undefined}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <TabBar
              tabs={[
                {
                  label: "Vendors",
                  value: "1",
                  icon: "Building",
                  count: filteredVendors.length,
                  isLoading: isVendorsLoading,
                },
                {
                  label: "Risks",
                  value: "2",
                  icon: "AlertTriangle",
                  count: vendorRisks.length,
                  isLoading: loadingVendorRisks,
                },
              ]}
              activeTab={value}
              onChange={handleChange}
              dataJoyrideId="vendor-list-tab"
            />
          </Box>
          {value !== "1" &&
            (loadingVendorRisks || isVendorsLoading ? (
              <CustomizableSkeleton
                variant="rectangular"
                width="50%"
                height={100}
              />
            ) : (
              <RisksCard risksSummary={vendorRisksSummary} />
            ))}
          {isVendorsLoading && value === "1" ? (
            <CustomizableSkeleton
              variant="rectangular"
              width={"15%"}
              height={35}
              sx={{ alignSelf: "flex-end" }}
            />
          ) : (
            value === "1" && (
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" gap={2} alignItems="center">
                    <Select
                      id="projects"
                      value={selectedProjectId ?? ""}
                      items={[
                        { _id: "all", name: "All Use Cases" },
                        ...projects.map((project) => ({
                          _id: project.id.toString(),
                          name: project.project_title,
                        })),
                      ]}
                      onChange={handleProjectChange}
                      sx={{
                        width: "180px",
                        minHeight: "34px",
                        borderRadius: theme.shape.borderRadius,
                      }}
                    />
                    <SearchBox
                      placeholder="Search vendors..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      sx={{ width: "180px" }}
                    />
                    <Select
                      id="status-filter"
                      value={statusFilter}
                      items={[
                        { _id: "all", name: "All statuses" },
                        { _id: "not_started", name: "Not started" },
                        { _id: "in_review", name: "In review" },
                        { _id: "reviewed", name: "Reviewed" },
                        { _id: "requires_follow_up", name: "Requires follow-up" },
                      ]}
                      onChange={handleStatusFilterChange}
                      sx={{
                        width: "180px",
                        minHeight: "34px",
                        borderRadius: theme.shape.borderRadius,
                      }}
                    />
                  </Stack>
                  <div data-joyride-id="add-new-vendor" ref={refs[0]}>
                    <CustomizableButton
                      variant="contained"
                      text="Add new vendor"
                      sx={{
                        backgroundColor: "#13715B",
                        border: "1px solid #13715B",
                        gap: 2,
                      }}
                      icon={<AddCircleOutlineIcon size={16} />}
                      onClick={() => {
                        openAddNewVendor();
                        setSelectedVendor(null);
                      }}
                      isDisabled={isCreatingDisabled}
                    />
                  </div>
                </Stack>
              </Stack>
            )
          )}

          {(loadingVendorRisks || isVendorsLoading) && value !== "1" ? (
            <CustomizableSkeleton
              variant="rectangular"
              width={"15%"}
              height={35}
              sx={{ alignSelf: "flex-end" }}
            />
          ) : (
            value !== "1" && (
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" gap={8} alignItems="center">
                  <Select
                    id="projects"
                    value={selectedProjectId ?? ""}
                    items={[
                      { _id: "all", name: "All Use Cases" },
                      ...projects.map((project) => ({
                        _id: project.id.toString(),
                        name: project.project_title,
                      })),
                    ]}
                    onChange={handleProjectChange}
                    sx={{
                      width: "180px",
                      minHeight: "34px",
                      borderRadius: theme.shape.borderRadius,
                    }}
                  />
                  <Select
                    id="vendors"
                    value={selectedVendorId}
                    items={[
                      { _id: "all", name: "All Vendors" },
                      ...vendorOptions.map((vendor) => ({
                        _id: vendor.id.toString(),
                        name: vendor.name,
                      })),
                    ]}
                    onChange={handleVendorChange}
                    sx={{
                      width: "180px",
                      minHeight: "34px",
                      borderRadius: theme.shape.borderRadius,
                    }}
                  />
                  <Select
                    id="filter-status"
                    value={filterStatus}
                    items={[
                      { _id: "active", name: "Active only" },
                      { _id: "all", name: "Active + deleted" },
                      { _id: "deleted", name: "Deleted only" },
                    ]}
                    onChange={handleFilterStatusChange}
                    sx={{
                      width: "160px",
                      minHeight: "34px",
                      borderRadius: theme.shape.borderRadius,
                    }}
                  />
                </Stack>
                <CustomizableButton
                  variant="contained"
                  text="Add new Risk"
                  sx={{
                    backgroundColor: "#13715B",
                    border: "1px solid #13715B",
                    gap: 2,
                  }}
                  icon={<AddCircleOutlineIcon size={16} />}
                  onClick={() => {
                    setSelectedRisk(null);
                    handleRiskModal();
                  }}
                  isDisabled={isCreatingDisabled}
                />
              </Stack>
            )
          )}

          {isVendorsLoading && value === "1" ? (
            <CustomizableSkeleton
              height={"20vh"}
              minHeight={"20vh"}
              minWidth={260}
              width={"100%"}
              maxWidth={"100%"}
              variant="rectangular"
            />
          ) : (
            <TabPanel value="1" sx={tabPanelStyle}>
              <TableWithPlaceholder
                vendors={filteredVendors}
                users={users}
                onDelete={handleDeleteVendor}
                onEdit={handleEditVendor}
              />
            </TabPanel>
          )}
          {(loadingVendorRisks || isVendorsLoading) && value !== "1" ? (
            <CustomizableSkeleton
              height={"20vh"}
              minHeight={"20vh"}
              minWidth={260}
              width={"100%"}
              maxWidth={"100%"}
              variant="rectangular"
            />
          ) : (
            <TabPanel value="2" sx={tabPanelStyle}>
              <RiskTable
                users={users}
                vendors={vendors}
                vendorRisks={vendorRisks}
                onDelete={handleDeleteRisk}
                onEdit={handleEditRisk}
                isDeletingAllowed={isDeletingAllowed}
              />
            </TabPanel>
          )}
        </TabContext>
      </Stack>
      <AddNewVendor
        isOpen={isOpen}
        setIsOpen={() => setIsOpen(false)}
        value={value}
        onSuccess={async () => {
          await refetchVendorRisks();
          await refetchVendors();
        }}
        existingVendor={selectedVendor}
      />
      <AddNewRisk
        isOpen={isRiskModalOpen}
        handleChange={handleChange}
        setIsOpen={handleRiskModal}
        value={value}
        onSuccess={refetchVendorRisks}
        existingRisk={selectedRisk}
        vendors={vendors}
      />
      {isSubmitting && (
        <CustomizableToast title="Processing your request. Please wait..." />
      )}
      </Stack>
  );
};

export default Vendors;
