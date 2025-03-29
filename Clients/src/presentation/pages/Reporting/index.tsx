import React, {Suspense, SyntheticEvent, lazy, useState} from 'react';
import { Stack, Typography, useTheme, Theme, Tab, Box } from '@mui/material';
import { vwhomeHeading } from '../Home/1.0Home/style';
import {TabContext, TabPanel, TabList} from '@mui/lab';
import { tabStyle, tabPanelStyle } from '../Vendors/style';
const GenerateReport = lazy(() => import('./GenerateReport'));
const ReportLists = lazy(() => import('./Reports'));

const Reporting = () => {
  const theme = useTheme();
  const [value, setValue] = useState<string>("generate");

  const handleTabChange = (_: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  }

  return (
    <Stack className="vwhome" gap={"20px"}>
      <ReportingHeader theme={theme} />
      <Stack>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={{
                minHeight: "20px",
                "& .MuiTabs-flexContainer": { columnGap: "34px" },
              }}
              onChange={handleTabChange}
            >
              <Tab 
                sx={tabStyle} 
                label="Generate a report"
                value="generate"
                disableRipple
              />
              <Tab 
                sx={tabStyle} 
                label="Reports generated"
                value="reports"
                disableRipple
              />
            </TabList>
          </Box>
          <TabPanel value="generate" sx={tabPanelStyle}>
            {/* Render generate view */}
            <Suspense fallback={"loading..."}>
              <GenerateReport />
            </Suspense>
          </TabPanel>
          <TabPanel value="reports" sx={tabPanelStyle}>
            {/* Render a report view */}
            <Suspense fallback={"loading..."}>
              <ReportLists />
            </Suspense>
          </TabPanel>
        </TabContext>
      </Stack>
    
    </Stack>
  )
}

const ReportingHeader: React.FC<{ theme: Theme }> = ({ theme }) => (  
  <Stack className='vwhome-header'>
    <Typography sx={vwhomeHeading}>Reporting</Typography>
    <Typography
      sx={{
        color: theme.palette.text.secondary,
        fontSize: theme.typography.fontSize,
      }}
    >
      This section will generate a report based on the information entered in Compliance Tracker, Assessment Tracker, Vendors and Risks sections.
    </Typography>
  </Stack>
);
 
export default Reporting;