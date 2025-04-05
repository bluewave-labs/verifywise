import {Suspense, SyntheticEvent, lazy, useState} from 'react';
import { Stack, Tab, Box } from '@mui/material';
import {TabContext, TabPanel, TabList} from '@mui/lab';
import { tabStyle, tabPanelStyle } from '../Vendors/style';
const GenerateReport = lazy(() => import('./GenerateReport'));
const ReportLists = lazy(() => import('./Reports'));
const ReportingHeader = lazy(() => import('../../components/Reporting/ReportOverviewHeader'));
import { styles } from './styles';

const Reporting = () => {
  const [value, setValue] = useState<string>("generate");

  const handleTabChange = (_: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  }

  return (
    <Stack className="vwhome" gap={"20px"}>
      <Suspense fallback={"loading..."}>
        <ReportingHeader  
          titlesx={styles.vwHeadingTitle}
          subsx={styles.vwSubHeadingTitle}
        />
      </Suspense>
      <Stack>
        <TabContext value={value}>
          <Box sx={styles.tabDivider}>
            <TabList
              TabIndicatorProps={{ style: { backgroundColor: "#13715B" } }}
              sx={styles.tabList}
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
 
export default Reporting;