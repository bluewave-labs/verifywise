import { Stack, Box } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { useState } from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Tab } from "@mui/material";
import WatchTowerEvents from "./Events";
import WatchTowerLogs from "./Loggings";
import HelperDrawer from "../../components/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import PageHeader from "../../components/Layout/PageHeader";

// Tab styles similar to Vendors page
const tabStyle = {
  textTransform: "none",
  fontWeight: 400,
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "16px 0 7px",
  minHeight: "20px",
  minWidth: "auto",
  "&.Mui-selected": {
    color: "#13715B",
  },
};

const tabPanelStyle = {
  padding: 0,
};

const WatchTower = () => {
  const [value, setValue] = useState("1");
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Stack className="vwhome" gap={"24px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        open={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(false)}
        title="Event tracker & audit logs"
        description="Monitor system activities and maintain comprehensive audit trails"
        whatItDoes="Track all **system events** and *user activities* across your **AI governance platform**. Capture detailed *audit logs* for **compliance monitoring**, *security analysis*, and **operational oversight**."
        whyItMatters="**Audit trails** are essential for demonstrating *compliance*, investigating incidents, and maintaining **accountability**. They provide *forensic evidence* for security reviews and help identify patterns in **system usage** and potential anomalies."
        quickActions={[]}
        useCases={[
          "**Compliance auditing** to demonstrate *control effectiveness* and **user activities**",
          "**Security investigations** when analyzing potential incidents or *unauthorized access*"
        ]}
        keyFeatures={[
          "**Real-time event monitoring** with *filtering* and **search capabilities**",
          "**Immutable audit logs** with *timestamps* and **user attribution**",
          "**Export functionality** for *compliance reporting* and **external analysis**"
        ]}
        tips={[]}
      />
    
      <Stack gap={"24px"} maxWidth={1400}>
      <PageHeader
               title="Event Tracker"
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
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              onChange={handleChange}
              sx={{
                minHeight: "20px",
                "& .MuiTabs-flexContainer": { columnGap: "34px" },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#13715B",
                  height: "1.5px",
                },
              }}
            >
              <Tab label="Events" value="1" sx={tabStyle} disableRipple />
              <Tab label="Logs" value="2" sx={tabStyle} disableRipple />
            </TabList>
          </Box>

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
