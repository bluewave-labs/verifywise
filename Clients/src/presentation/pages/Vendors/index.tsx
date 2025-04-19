import "./index.css";
import { Box, Stack, Tab, Typography, useTheme } from "@mui/material";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder/index";
import RiskTable from "../../components/Table/RisksTable";
import { Suspense, useCallback, useContext, useEffect, useState } from "react";
import AddNewVendor from "../../components/Modals/NewVendor";
import singleTheme from "../../themes/v1SingleTheme";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  deleteEntityById,
  getAllEntities,
  getEntityById,
} from "../../../application/repository/entity.repository";
import { tabPanelStyle, tabStyle } from "./style";
import { logEngine } from "../../../application/tools/log.engine";
import Alert from "../../components/Alert";
import PageTour from "../../components/PageTour";
import VendorsSteps from "./VendorsSteps";
import useMultipleOnScreen from "../../../application/hooks/useMultipleOnScreen";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AddNewRisk from "../../components/Modals/NewRisk";
import VWButton from "../../vw-v2-components/Buttons";
import VWSkeleton from "../../vw-v2-components/Skeletons";
import VWToast from "../../vw-v2-components/Toast";
import { Project } from "../../../domain/Project";
import RisksCard from "../../components/Cards/RisksCard";
import { vwhomeHeading } from "../Home/1.0Home/style";
import useVendorRisks from "../../../application/hooks/useVendorRisks";

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
export interface VendorDetails {
  id?: number;
  projects: number[];
  vendor_name: string;
  vendor_provides: string;
  website: string;
  vendor_contact_person: string;
  review_result: string;
  review_status: string;
  reviewer: string;
  risk_status: string;
  review_date: string;
  assignee: string;
}

const Vendors = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isVendorsLoading, setIsVendorsLoading] = useState(true);
  const [isRisksLoading, setIsRisksLoading] = useState(true);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [value, setValue] = useState("1");
  const [project, setProject] = useState<Project>();
  const { dashboardValues, setDashboardValues } = useContext(VerifyWiseContext);
  const [selectedVendor, setSelectedVendor] = useState<VendorDetails | null>(
    null
  );
  const [selectedRisk, setSelectedRisk] = useState<ExistingRisk | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedProjectId } = dashboardValues;
  const { vendorRisksSummary } = useVendorRisks({
    projectId: selectedProjectId?.toString(),
    refreshKey,
  });
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const [runVendorTour, setRunVendorTour] = useState(false);
  const { refs, allVisible } = useMultipleOnScreen<HTMLDivElement>({
    countToTrigger: 1,
  });

  const createAbortController = () => {
    if (controller) {
      controller.abort();
    }
    const newController = new AbortController();
    setController(newController);
    return newController.signal;
  };
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
    const fetchProject = async () => {
      try {
        const projectData = await getEntityById({
          routeUrl: `/projects/${selectedProjectId}`,
        });
        setProject(projectData.data);
      } catch (error) {
        console.error("Failed to fetch project data:", error);
      }
    };

    if (selectedProjectId) {
      fetchProject();
    }
  }, [selectedProjectId]);

  const fetchVendors = useCallback(async () => {
    const signal = createAbortController();
    if (signal.aborted) return;
    setIsVendorsLoading(true);
    if (!selectedProjectId) return;
    try {
      const response = await getAllEntities({
        routeUrl: `/vendors/project-id/${selectedProjectId}`,
        signal,
      });
      if (response?.data) {
        setDashboardValues((prevValues: any) => ({
          ...prevValues,
          vendors: response.data,
        }));
        setRefreshKey((prevKey) => prevKey + 1);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setIsVendorsLoading(false);
    }
  }, [selectedProjectId]);

  const fetchRisks = useCallback(async () => {
    const signal = createAbortController();
    if (signal.aborted) return;
    setIsRisksLoading(true);
    if (!selectedProjectId) return;
    try {
      const response = await getAllEntities({
        routeUrl: `/vendorRisks/by-projid/${selectedProjectId}`,
        signal,
      });
      if (response?.data) {
        setDashboardValues((prevValues: any) => ({
          ...prevValues,
          vendorRisks: response.data,
          selectedProjectId: selectedProjectId,
        }));
        setRefreshKey((prevKey) => prevKey + 1);
      }
    } catch (error) {
      console.error("Error fetching vendorRisks:", error);
    } finally {
      setIsRisksLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchVendors();
    return () => {
      controller?.abort();
    };
  }, [selectedProjectId]);

  useEffect(() => {
    fetchRisks();
    return () => {
      controller?.abort();
    };
  }, [selectedProjectId]);

  useEffect(() => {
    if (allVisible) {
      setRunVendorTour(true);
    }
  }, [allVisible]);

  const handleDeleteVendor = async (vendorId: number) => {
    setIsSubmitting(true);

    try {
      const response = await deleteEntityById({
        routeUrl: `/vendors/${vendorId}`,
      });

      if (response.status === 202) {
        setDashboardValues((prevValues: any) => ({
          ...prevValues,
          vendors: prevValues.vendors.filter(
            (vendor: any) => vendor.id !== vendorId
          ),
        }));
        setAlert({
          variant: "success",
          body: "Vendor deleted successfully.",
        });
        setTimeout(() => {
          setAlert(null);
        }, 3000);
        await fetchVendors();
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
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      logEngine({
        type: "error",
        message: `An error occurred: ${error}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteRisk = async (vendorId: number) => {
    const signal = createAbortController();
    setIsSubmitting(true);

    try {
      const response = await deleteEntityById({
        routeUrl: `/vendorRisks/${vendorId}`,
        signal,
      });

      if (response.status === 202) {
        setAlert({
          variant: "success",
          body: "Risk deleted successfully.",
        });
        setTimeout(() => {
          setAlert(null);
        }, 3000);

        await fetchRisks();
      } else if (response.status === 404) {
        setAlert({
          variant: "error",
          body: "Risk not found.",
        });
      } else {
        console.error("Unexpected response. Please try again.");
        logEngine({
          type: "error",
          message: "Unexpected response. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error deleting Risk:", error);
      logEngine({
        type: "error",
        message: `An error occurred: ${error}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEditRisk = async (id: number) => {
    try {
      const response = await getEntityById({
        routeUrl: `/vendorRisks/${id}`,
      });
      setSelectedRisk(response.data);
      setIsRiskModalOpen(true);
    } catch (e) {
      logEngine({
        type: "error",
        message: "Failed to update risk data.",
      });
    }
  };
  const handleEditVendor = async (id: number) => {
    try {
      const response = await getEntityById({
        routeUrl: `/vendors/${id}`,
      });
      setSelectedVendor(response.data);
      setIsOpen(true);
    } catch (e) {
      logEngine({
        type: "error",
        message: "Failed to fetch vendor data.",
      });
    }
  };

  return (
    <div className="vendors-page">
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
            <Stack>
              <Typography sx={vwhomeHeading}>Vendor list</Typography>
              <Typography sx={singleTheme.textStyles.pageDescription}>
                This table includes a list of external entities that provides
                AI-related products, services, or components. You can create and
                manage all vendors here.
              </Typography>
            </Stack>
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

            <Stack>
              <Typography
                variant="h2"
                component="div"
                sx={{
                  pb: 8.5,
                  color: "#1A1919",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Vendor risks list
              </Typography>
              <Typography sx={singleTheme.textStyles.pageDescription}>
                This table includes a list of risks related to a vendor. You can
                create and manage all vendor risks here.
              </Typography>
            </Stack>
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
            (isRisksLoading || isVendorsLoading ? (
              <VWSkeleton variant="rectangular" width="50%" height={100} />
            ) : (
              project && <RisksCard risksSummary={vendorRisksSummary} />
            ))}
          {isVendorsLoading && value === "1" ? (
            <VWSkeleton
              variant="rectangular"
              width={"15%"}
              height={35}
              sx={{ alignSelf: "flex-end" }}
            />
          ) : (
            value === "1" && (
              <Stack sx={{ alignItems: "flex-end" }}>
                <div data-joyride-id="add-new-vendor" ref={refs[0]}>
                  <VWButton
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
                  />
                </div>
              </Stack>
            )
          )}

          {(isRisksLoading || isVendorsLoading) && value !== "1" ? (
            <VWSkeleton
              variant="rectangular"
              width={"15%"}
              height={35}
              sx={{ alignSelf: "flex-end" }}
            />
          ) : (
            value !== "1" && (
              <Stack sx={{ alignItems: "flex-end" }}>
                <VWButton
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
                />
              </Stack>
            )
          )}

          {isVendorsLoading && value === "1" ? (
            <VWSkeleton
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
                dashboardValues={dashboardValues}
                onDelete={handleDeleteVendor}
                onEdit={handleEditVendor}
              />
            </TabPanel>
          )}
          {(isRisksLoading || isVendorsLoading) && value !== "1" ? (
            <VWSkeleton
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
                dashboardValues={dashboardValues}
                onDelete={handleDeleteRisk}
                onEdit={handleEditRisk}
              />
            </TabPanel>
          )}
        </TabContext>
      </Stack>
      <AddNewVendor
        isOpen={isOpen}
        setIsOpen={() => setIsOpen(false)}
        value={value}
        onSuccess={fetchVendors}
        existingVendor={selectedVendor}
      />
      <AddNewRisk
        isOpen={isRiskModalOpen}
        handleChange={handleChange}
        setIsOpen={handleRiskModal}
        value={value}
        onSuccess={fetchRisks}
        existingRisk={selectedRisk}
      />
      {isSubmitting && (
        <VWToast title="Processing your request. Please wait..." />
      )}
    </div>
  );
};

export default Vendors;
