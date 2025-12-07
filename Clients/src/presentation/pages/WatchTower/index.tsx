import { Stack } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { useState, useEffect } from "react";
import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import WatchTowerEvents from "./Events";
import WatchTowerLogs from "./Loggings";
import HelperIcon from "../../components/HelperIcon";
import PageHeader from "../../components/Layout/PageHeader";
import TipBox from "../../components/TipBox";
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

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    if (newValue === "1") navigate("/event-tracker");
    else if (newValue === "2") navigate("/event-tracker/logs");
  };

  return (
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs />

      <Stack gap={"16px"} maxWidth={1400}>
      <PageHeader
               title="Event Tracker"
               description="Event Tracker gives you a live window into VerifyWise. It records
                every user action and system event, then lets you dive into the raw
                logs for deeper troubleshooting. Use it to see who did what, spot
                patterns, and keep your application healthy"
               rightContent={
                  <HelperIcon
                     articlePath="ai-governance/watchtower"
                     size="small"
                    />
                 }
             />
        <TipBox entityName="event-tracker" />

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
