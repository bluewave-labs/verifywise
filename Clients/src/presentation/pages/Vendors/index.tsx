import "./index.css";
import {
  Box,
  SelectChangeEvent,
  Stack,
  Tab,
  useTheme,
} from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder/index";
import RiskTable from "../../components/Table/RisksTable";
import { Suspense, useEffect, useState, useMemo } from "react";
import AddNewVendor from "../../components/Modals/NewVendor";
import { useSelector } from "react-redux";
import { extractUserToken } from "../../../application/tools/extractToken";
import { AppState } from "../../../application/interfaces/appStates";
import useUsers from "../../../application/hooks/useUsers";
import { tabPanelStyle, tabStyle } from "./style";
import { logEngine } from "../../../application/tools/log.engine";
import Alert from "../../components/Alert";
import PageTour from "../../components/PageTour";
import VendorsSteps from "./VendorsSteps";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { ReactComponent as AddCircleOutlineIcon } from "../../assets/icons/plus-circle-white.svg"
import AddNewRisk from "../../components/Modals/NewRisk";
import CustomizableButton from "../../components/Button/CustomizableButton";
import CustomizableSkeleton from "../../components/Skeletons";
import CustomizableToast from "../../components/Toast";
import RisksCard from "../../components/Cards/RisksCard";
import useVendorRisks from "../../../application/hooks/useVendorRisks";
import Select from "../../components/Inputs/Select";
import allowedRoles from "../../../application/constants/permissions";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import vendorHelpContent from "../../../presentation/helpers/vendor-help.html?raw";
import {
  useVendors,
  useDeleteVendor,
  VendorDetails,
} from "../../../application/hooks/useVendors";
import { useProjects } from "../../../application/hooks/useProjects";
import { useDeleteVendorRisk } from "../../../application/hooks/useVendorRiskMutations";
import { getVendorById } from "../../../application/repository/vendor.repository";
import { getVendorRiskById } from "../../../application/repository/vendorRisk.repository";
import PageHeader from "../../components/Layout/PageHeader";

interface ExistingRisk {
  id?: number;
  risk_description: string;
  impact_description: string;
  project_name?: string;
  impact: string;
  action_owner: string;
  risk_severity: string;
  likelihood: string;
  risk_level: string;
  action_plan: string;
  vendor_id: string;
}

// Export VendorDetails interface for use in other components
export type { VendorDetails };

const Vendors = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [value, setValue] = useState("1");
  const authToken = useSelector((state: AppState) => state.auth.authToken);
  const userToken = extractUserToken(authToken);
  const userRoleName = userToken?.roleName || "";
  const { users } = useUsers();

  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [selectedRisk, setSelectedRisk] = useState<ExistingRisk | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");

  // TanStack Query hooks
  const { data: projects = [] } = useProjects();
  const { data: vendors = [], isLoading: isVendorsLoading } = useVendors({
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
    setValue(newValue);
  };

  useEffect(() => {
    if (allVisible) {
      setRunVendorTour(true);
    }
  }, [allVisible]);

  const handleDeleteVendor = async (vendorId: number) => {
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

  const handleEditVendor = async (id: number) => {
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

  return (
    <Stack className="vwhome" gap={"20px"}>
     <PageBreadcrumbs />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={vendorHelpContent}
        pageTitle="Vendor Management"
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
      <Stack gap={theme.spacing(10)} maxWidth={1400}>
        {value === "1" ? (
          <>
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
             <PageHeader
               title="Vendor list"
               description="This table includes a list of external entities that provide AI-related products, services, or components. You can create and manage all vendors here."
               rightContent={
                  <HelperIcon
                     onClick={() =>
                     setIsHelperDrawerOpen(!isHelperDrawerOpen)
                     }
                     size="small"
                    />
                 }
             />
          </>
        ) : (
          <>
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

            <PageHeader
                title="Vendor risks list"
                description="This table includes a list of risks related to a vendor. You can create and manage all vendor risks here."
                />
          </>
        )}
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleChange}
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={{
                minHeight: "20px",
                "& .MuiTabs-flexContainer": { columnGap: "34px" },
              }}
            >
              <Tab label="Vendors" value="1" sx={tabStyle} disableRipple />
              <Tab label="Risks" value="2" sx={tabStyle} disableRipple />
            </TabList>
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
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Select
                  id="projects"
                  value={selectedProjectId ?? ""}
                  items={[
                    { _id: "all", name: "All Projects" },
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
                <div data-joyride-id="add-new-vendor" ref={refs[0]}>
                  <CustomizableButton
                    variant="contained"
                    text="Add new vendor"
                    sx={{
                      backgroundColor: "#13715B",
                      border: "1px solid #13715B",
                      gap: 2,
                    }}
                    icon={<AddCircleOutlineIcon />}
                    onClick={() => {
                      openAddNewVendor();
                      setSelectedVendor(null);
                    }}
                    isDisabled={isCreatingDisabled}
                  />
                </div>
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
                      { _id: "all", name: "All Projects" },
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
                </Stack>
                <CustomizableButton
                  variant="contained"
                  text="Add new Risk"
                  sx={{
                    backgroundColor: "#13715B",
                    border: "1px solid #13715B",
                    gap: 2,
                  }}
                  icon={<AddCircleOutlineIcon />}
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
                vendors={vendors}
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
