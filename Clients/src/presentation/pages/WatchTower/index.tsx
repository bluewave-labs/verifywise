import { Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { useState, useEffect } from "react";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import WatchTowerEvents from "./Events";
import WatchTowerLogs from "./Loggings";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import PageHeader from "../../components/Layout/PageHeader";
import { useLocation, useNavigate } from "react-router-dom";
import TabBar from "../../components/TabBar";

const tabPanelStyle = {
  padding: 0,
};

const WatchTower = () => {
  const location = useLocation();
  const navigate = useNavigate();

  //tab from URL
  const isLogsPage = location.pathname.includes("/logs");
  const [value, setValue] = useState(isLogsPage ? "2" : "1");

  // Keep state in sync with URL
  useEffect(() => {
    setValue(isLogsPage ? "2" : "1");
  }, [isLogsPage, location.pathname]);

  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    if (newValue === "1") navigate("/event-tracker");
    else if (newValue === "2") navigate("/event-tracker/logs");
  };

  return (
    <Stack className="vwhome" gap={"24px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Event tracker & audit logs"
        description="Monitor system activities and maintain comprehensive audit trails"
        whatItDoes="Track all *system events* and *user activities* across your *AI governance platform*. Capture detailed *audit logs* for *compliance monitoring*, *security analysis*, and *operational oversight*."
        whyItMatters="**Audit trails** are essential for demonstrating *compliance*, investigating incidents, and maintaining *accountability*. They provide *forensic evidence* for security reviews and help identify patterns in *system usage* and potential anomalies."
        quickActions={[]}
        useCases={[
          "*Compliance auditing* to demonstrate *control effectiveness* and *user activities*",
          "*Security investigations* when analyzing potential incidents or *unauthorized access*"
        ]}
        keyFeatures={[
          "*Real-time event monitoring* with *filtering* and *search capabilities*",
          "*Immutable audit logs* with *timestamps* and *user attribution*",
          "*Export functionality* for *compliance reporting* and *external analysis*"
        ]}
        tips={[]}
      />
    
      <Stack gap={"24px"} maxWidth={1400}>
      <PageHeader
               title="Event tracker"
               description="Event Tracker gives you a live window into VerifyWise. It records
                every user action and system event, then lets you dive into the raw
                logs for deeper troubleshooting. Use it to see who did what, spot
                patterns, and keep your application healthy"
               rightContent={
                  <HelperIcon
                     onClick={() =>
                     setIsHelperDrawerOpen(!isHelperDrawerOpen)
                     }
                     size="small"
                    />
                 }
             />

        <TabContext value={value}>
          <TabBar
            tabs={[
              {
                label: "Events",
                value: "1",
                icon: "Calendar",
              },
              {
                label: "Logs",
                value: "2",
                icon: "FileText",
              },
            ]}
            activeTab={value}
            onChange={handleChange}
          />

          <TabPanel value="1" sx={tabPanelStyle}>
            <WatchTowerEvents />
          </TabPanel>

          <TabPanel value="2" sx={tabPanelStyle}>
            <WatchTowerLogs />
          </TabPanel>
        </TabContext>
      </Stack>
    </Stack>
  );
};

export default WatchTower;
