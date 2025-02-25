/**
 * This file is currently in use
 */

import "./index.css";
import { Box, Button, Stack, Tab, Typography, useTheme } from "@mui/material";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder/index";
import RiskTable from "../../components/Table/RisksTable";
import { Suspense, useCallback, useContext, useEffect, useState } from "react";

import AddNewVendor from "../../components/Modals/NewVendor";
import singleTheme from "../../themes/v1SingleTheme";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";
import {
  deleteEntityById,
  getAllEntities,
} from "../../../application/repository/entity.repository";
import { logEngine } from "../../../application/tools/log.engine";
import Alert from "../../components/Alert";
import PageTour from "../../components/PageTour";
import CustomStep from "../../components/PageTour/CustomStep";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import {User} from "../../../domain/User"

const Vendors = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("1");
  const [vendorChangeTrigger, setVendorChangeTrigger] = useState(0);
  const [vendorRiskChangeTrigger, setVendorRiskChangeTrigger] = useState(0);
  const { dashboardValues, setDashboardValues } = useContext(VerifyWiseContext);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [runVendorTour, setRunVendorTour] = useState(false);
  const { currentProjectId } = useContext(VerifyWiseContext);
  const vendorSteps = [
    {
      target: '[data-joyride-id="add-new-vendor"]',
      content: (
        <CustomStep body="Here, you can add AI providers that you use in our project, and input the necessary information to ensure compliance." />
      ),
    },
  ];

  const openAddNewVendor = () => {
    setIsOpen(true);
  };

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const fetchVendors = useCallback(async () => {
    try {
      const response = await getAllEntities({ routeUrl: "/vendors" });
      setDashboardValues((prevValues: any) => ({
        ...prevValues,
        vendors: response.data,
      }));
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  }, [setDashboardValues]);

  const fetchRisks = useCallback(async () => {
    try {
      const response = await getAllEntities({
        routeUrl: `/vendorRisks/by-projid/${currentProjectId}`,
      });
      setDashboardValues((prevValues: any) => ({
        ...prevValues,
        vendorRisks: response.data,
      }));
    } catch (error) {
      console.error("Error fetching vendorRisks:", error);
    }
  }, [setDashboardValues, currentProjectId]);

  useEffect(() => {
    fetchVendors();
    setRunVendorTour(true);
  }, [fetchVendors, vendorChangeTrigger]);

  useEffect(() => {
    if (!currentProjectId) return;
    fetchRisks();
  }, [fetchRisks, vendorRiskChangeTrigger]);

  const updateVendorChangeTrigger = () => {
    setVendorChangeTrigger((prev) => prev + 1);
  };
  const updateVendorRiskChangeTrigger = () => {
    setVendorRiskChangeTrigger((prev) => prev + 1);
  };

  const handleDeleteVendor = async (vendorId: number) => {
    const user : User = {
      id: Number(localStorage.getItem("userId")) || 0,
      email: "N/A",
      name: "N/A",
      surname: "N/A",
    };
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
        updateVendorChangeTrigger();
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
          user : {
          id: String(user.id),
          email: user.email ?? "N/A",
          firstname: user.name,
          lastname: user.surname,
        },
        });
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      logEngine({
        type: "error",
        message: `An error occurred: ${error}`,
        user : {
          id: String(user.id),
          email: user.email ?? "N/A",
          firstname: user.name,
          lastname: user.surname,
        },
      });
    }
  };

  return (
    <div className="vendors-page">
      <PageTour
        steps={vendorSteps}
        run={runVendorTour}
        onFinish={() => setRunVendorTour(false)}
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
              <Typography
                data-joyride-id="assessment-status"
                variant="h2"
                component="div"
                sx={{
                  pb: 8.5,
                  color: "#1A1919",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Vendor list
              </Typography>
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
                data-joyride-id="assessment-status"
                variant="h2"
                component="div"
                sx={{
                  pb: 8.5,
                  color: "#1A1919",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Risk list
              </Typography>
              <Typography sx={singleTheme.textStyles.pageDescription}>
                This table includes a list of Risks related to a project. You
                can create and manage all vendor risks here.
              </Typography>
            </Stack>
          </>
        )}
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange}>
              <Tab
                label="Vendors"
                value="1"
                sx={{
                  width: 120,
                  paddingX: 0,
                  textTransform: "inherit",
                  fontSize: 13,
                  "& .MuiTouchRipple-root": {
                    display: "none",
                  },
                }}
              />
              <Tab
                label="Risks"
                value="2"
                sx={{
                  width: 120,
                  paddingX: 0,
                  textTransform: "inherit",
                  fontSize: 13,
                  "& .MuiTouchRipple-root": {
                    display: "none",
                  },
                }}
              />
            </TabList>
          </Box>
          {value === "1" ? (
            <Stack
              sx={{
                alignItems: "flex-end",
              }}
            >
              <Button
                data-joyride-id="add-new-vendor"
                disableRipple={
                  theme.components?.MuiButton?.defaultProps?.disableRipple
                }
                variant="contained"
                sx={{
                  ...singleTheme.buttons.primary,
                  width: 150,
                  height: 34,
                  "&:hover": {
                    backgroundColor: "#175CD3 ",
                  },
                }}
                onClick={() => {
                  openAddNewVendor();
                }}
              >
                Add new vendor
              </Button>
            </Stack>
          ) : (
            <Stack
              sx={{
                alignItems: "flex-end",
              }}
            >
              <Button
                data-joyride-id="add-new-vendor"
                disableRipple={
                  theme.components?.MuiButton?.defaultProps?.disableRipple
                }
                variant="contained"
                sx={{
                  ...singleTheme.buttons.primary,
                  width: 150,
                  height: 34,
                  "&:hover": {
                    backgroundColor: "#175CD3 ",
                  },
                }}
                onClick={() => {
                  openAddNewVendor();
                }}
              >
                Add new Risk
              </Button>
            </Stack>
          )}
          <TabPanel value="1">
            <TableWithPlaceholder
              dashboardValues={dashboardValues}
              onVendorChange={updateVendorChangeTrigger}
              onDeleteVendor={handleDeleteVendor}
            />
          </TabPanel>
          <TabPanel value="2">
            <RiskTable
              dashboardValues={dashboardValues}
              onVendorChange={updateVendorRiskChangeTrigger}
              onDeleteVendor={handleDeleteVendor}
            />
          </TabPanel>
        </TabContext>
      </Stack>
      <AddNewVendor
        isOpen={isOpen}
        handleChange={handleChange}
        setIsOpen={() => setIsOpen(false)}
        value={value}
        onVendorChange={updateVendorChangeTrigger}
      />
    </div>
  );
};

export default Vendors;
