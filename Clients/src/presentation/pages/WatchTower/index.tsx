import { Stack, Typography, useTheme, Box } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import { useState } from "react";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Tab } from "@mui/material";
import singleTheme from "../../themes/v1SingleTheme";
import WatchTowerEvents from "./Events";
import WatchTowerLogs from "./Loggings";

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

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <div className="watch-tower-page">
      <PageBreadcrumbs />
      <Stack gap={theme.spacing(10)} maxWidth={1400}>
        <Stack>
          <Typography
            sx={{
              color: "#1A1919",
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Event Tracker
          </Typography>
          <Typography sx={singleTheme.textStyles.pageDescription}>
            Event Tracker gives you a live window into VerifyWise. It records
            every user action and system event, then lets you dive into the raw
            logs for deeper troubleshooting. Use it to see who did what, spot
            patterns, and keep your application healthy
          </Typography>
        </Stack>

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
    </div>
  );
};

export default WatchTower;
