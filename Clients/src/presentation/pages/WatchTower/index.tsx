import { Stack, useTheme, Box } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { useState } from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Tab } from "@mui/material";
import WatchTowerEvents from "./Events";
import WatchTowerLogs from "./Loggings";
import HelperDrawer from "../../components/Drawer/HelperDrawer";
import HelperIcon from "../../components/HelperIcon";
import eventTrackerHelpContent from "../../helpers/event-tracker-help.html?raw";
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
  const theme = useTheme();
  const [value, setValue] = useState("1");
  const [isHelperDrawerOpen, setIsHelperDrawerOpen] = useState(false);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Stack className="vwhome" gap={"20px"}>
      <PageBreadcrumbs />
      <HelperDrawer
        isOpen={isHelperDrawerOpen}
        onClose={() => setIsHelperDrawerOpen(!isHelperDrawerOpen)}
        helpContent={eventTrackerHelpContent}
        pageTitle="Event Tracker"
      />
    
      <Stack gap={theme.spacing(10)} maxWidth={1400}>
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
