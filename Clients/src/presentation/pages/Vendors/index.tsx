import "./index.css";
import { Button, Stack, Typography, useTheme } from "@mui/material";
import TableWithPlaceholder from "../../components/Table/WithPlaceholder/index";
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

const Vendors = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("1");
  const [vendorChangeTrigger, setVendorChangeTrigger] = useState(0);
  const { dashboardValues, setDashboardValues } = useContext(VerifyWiseContext);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);
  const [runVendorTour, setRunVendorTour] = useState(false);

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
      console.log("response :::: > ", response);
      setDashboardValues((prevValues: any) => ({
        ...prevValues,
        vendors: response.data,
      }));
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  }, [setDashboardValues]);

  useEffect(() => {
    fetchVendors();
    setRunVendorTour(true);
  }, [fetchVendors, vendorChangeTrigger]);

  const updateVendorChangeTrigger = () => {
    setVendorChangeTrigger((prev) => prev + 1);
  };

  const handleDeleteVendor = async (vendorId: number) => {
    const user = {
      id: String(localStorage.getItem("userId")) || "N/A",
      email: "N/A",
      firstname: "N/A",
      lastname: "N/A",
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
          user,
        });
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      logEngine({
        type: "error",
        message: `An error occurred: ${error}`,
        user,
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
        <TableWithPlaceholder
          dashboardValues={dashboardValues}
          onVendorChange={updateVendorChangeTrigger}
          onDeleteVendor={handleDeleteVendor}
        />
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
