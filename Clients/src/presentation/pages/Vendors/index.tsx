import "./index.css";
import {
  Box,
  SelectChangeEvent,
  Stack,
  Tab,
  Typography,
  useTheme,
} from "@mui/material";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder/index";
import RiskTable from "../../components/Table/RisksTable";
import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
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
import { Project } from "../../../domain/types/Project";
import RisksCard from "../../components/Cards/RisksCard";
import { vwhomeHeading } from "../Home/1.0Home/style";
import useVendorRisks from "../../../application/hooks/useVendorRisks";
import Select from "../../components/Inputs/Select";

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
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [value, setValue] = useState("1");
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<VendorDetails[]>([]);
  const { users } = useContext(VerifyWiseContext);
  const [selectedVendor, setSelectedVendor] = useState<VendorDetails | null>(
    null
  );
  const [selectedRisk, setSelectedRisk] = useState<ExistingRisk | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string>("all");
  const {
    vendorRisksSummary,
    refetchVendorRisks,
    vendorRisks,
    loadingVendorRisks,
  } = useVendorRisks({
    projectId: selectedProjectId?.toString(),
    vendorId: selectedVendorId?.toString(),
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
    const fetchProjects = async () => {
      try {
        const response = await getAllEntities({ routeUrl: "/projects" });
        if (response?.data && response.data.length > 0) {
          setProjects(response.data);
          setSelectedProjectId(response.data[0].id?.toString() ?? null); // Default to first project as string
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };
    fetchProjects();
  }, []);

  const fetchVendors = useCallback(async () => {
    const signal = createAbortController();
    if (signal.aborted) return;
    setIsVendorsLoading(true);
    if (!selectedProjectId) return;
    try {
      const routeUrl =
        selectedProjectId === "all"
          ? "/vendors"
          : `/vendors/project-id/${selectedProjectId}`;
      const response = await getAllEntities({
        routeUrl,
        signal,
      });
      if (response?.data) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setIsVendorsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchVendors();
    return () => {
      controller?.abort();
    };
  }, [selectedProjectId]);

  useEffect(() => {
    refetchVendorRisks();
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
        setVendors((prevVendors) =>
          prevVendors.filter((vendor) => vendor.id !== vendorId)
        );
        setAlert({
          variant: "success",
          body: "Vendor deleted successfully.",
        });
        setTimeout(() => {
          setAlert(null);
        }, 3000);
        await fetchVendors();
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

        await refetchVendorRisks();
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
    vendors.forEach((vendor: VendorDetails) => {
      if (!uniqueVendors.has(vendor.id)) {
        uniqueVendors.set(vendor.id, {
          id: vendor.id,
          name: vendor.vendor_name,
          project_id: vendor.projects[0], // Assuming first project is the main one
        });
      }
    });

    const vendorList = Array.from(uniqueVendors.values());
    if (!selectedProjectId || selectedProjectId === "all") {
      return vendorList;
    }
    return vendorList.filter(
      (vendor) => vendor.project_id.toString() === selectedProjectId
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
            (loadingVendorRisks || isVendorsLoading ? (
              <VWSkeleton variant="rectangular" width="50%" height={100} />
            ) : (
              <RisksCard risksSummary={vendorRisksSummary} />
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
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
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

          {(loadingVendorRisks || isVendorsLoading) && value !== "1" ? (
            <VWSkeleton
              variant="rectangular"
              width={"15%"}
              height={35}
              sx={{ alignSelf: "flex-end" }}
            />
          ) : (
            value !== "1" && (
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Stack direction="row" gap={2} alignItems="center">
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
                vendors={vendors}
                users={users}
                onDelete={handleDeleteVendor}
                onEdit={handleEditVendor}
              />
            </TabPanel>
          )}
          {(loadingVendorRisks || isVendorsLoading) && value !== "1" ? (
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
                users={users}
                vendors={vendors}
                vendorRisks={vendorRisks}
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
        onSuccess={refetchVendorRisks}
        existingRisk={selectedRisk}
        vendors={vendors}
      />
      {isSubmitting && (
        <VWToast title="Processing your request. Please wait..." />
      )}
    </div>
  );
};

export default Vendors;
