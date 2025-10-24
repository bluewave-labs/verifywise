import React, { useState } from 'react';
import ShowcaseLayout from '../ShowcaseLayout';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  Button,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Pagination,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
// Lucide icons - will use inline for now to avoid import issues
import {
  Home,
  Folder,
  Description,
  NavigateNext,
  Search,
  Notifications,
  AccountCircle,
  Settings,
  ExitToApp,
  ViewList,
  ViewModule,
  ViewQuilt,
  ArrowBack,
  ArrowForward,
  FirstPage,
  LastPage,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const NavigationShowcase: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'module' | 'quilt'>('list');
  const [activeStep, setActiveStep] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <ShowcaseLayout title="Navigation & Layout" currentPage="/navigation-showcase">
      <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Navigation & Layout Components
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Complete reference for navigation menus, breadcrumbs, tabs, and layout components.
      </Typography>

      {/* Breadcrumbs */}
      <Typography variant="h4" gutterBottom>Breadcrumbs</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Standard Breadcrumbs</Typography>
            <Stack spacing={2}>
              <Breadcrumbs aria-label="breadcrumb">
                <Link color="inherit" href="#" underline="hover">
                  Home
                </Link>
                <Link color="inherit" href="#" underline="hover">
                  Projects
                </Link>
                <Typography color="text.primary">Current Project</Typography>
              </Breadcrumbs>

              <Breadcrumbs aria-label="breadcrumb" separator="›">
                <Link color="inherit" href="#" underline="hover">
                  Dashboard
                </Link>
                <Link color="inherit" href="#" underline="hover">
                  Analytics
                </Link>
                <Link color="inherit" href="#" underline="hover">
                  Reports
                </Link>
                <Typography color="text.primary">Monthly Report</Typography>
              </Breadcrumbs>

              <Breadcrumbs maxItems={2} aria-label="breadcrumb">
                <Link color="inherit" href="#" underline="hover">
                  Home
                </Link>
                <Link color="inherit" href="#" underline="hover">
                  Very Long Category Name That Gets Truncated
                </Link>
                <Link color="inherit" href="#" underline="hover">
                  Subcategory
                </Link>
                <Typography color="text.primary">Current Page</Typography>
              </Breadcrumbs>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Breadcrumbs with Icons</Typography>
            <Stack spacing={2}>
              <Breadcrumbs aria-label="breadcrumb">
                <Link color="inherit" href="#" underline="hover">
                  <Home sx={{ mr: 0.5 }} fontSize="inherit" />
                  Home
                </Link>
                <Link color="inherit" href="#" underline="hover">
                  <Folder sx={{ mr: 0.5 }} fontSize="inherit" />
                  Documents
                </Link>
                <Typography color="text.primary">
                  <Description sx={{ mr: 0.5 }} fontSize="inherit" />
                  File.pdf
                </Typography>
              </Breadcrumbs>

              <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNext fontSize="small" />}>
                <Button color="inherit" startIcon={<Home fontSize="small" />}>
                  Home
                </Button>
                <Button color="inherit" startIcon={<Folder fontSize="small" />}>
                  Projects
                </Button>
                <Button color="inherit" startIcon={<Settings fontSize="small" />}>
                  Settings
                </Button>
              </Breadcrumbs>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Typography variant="h4" gutterBottom>Tabs</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Standard Tabs</Typography>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Overview" />
              <Tab label="Details" />
              <Tab label="Settings" />
              <Tab label="Help" />
            </Tabs>
            <TabPanel value={tabValue} index={0}>
              <Typography>Overview content goes here...</Typography>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Typography>Details content goes here...</Typography>
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <Typography>Settings content goes here...</Typography>
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <Typography>Help content goes here...</Typography>
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Tab Variations</Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Scrollable Tabs</Typography>
                <Tabs
                  value={0}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ maxWidth: 400 }}
                >
                  <Tab label="Item 1" />
                  <Tab label="Item 2" />
                  <Tab label="Item 3" />
                  <Tab label="Item 4" />
                  <Tab label="Item 5" />
                  <Tab label="Item 6" />
                  <Tab label="Item 7" />
                </Tabs>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Icon Tabs</Typography>
                <Tabs value={0}>
                  <Tab icon={<Search />} />
                  <Tab icon={<Notifications />} />
                  <Tab icon={<AccountCircle />} />
                  <Tab icon={<Settings />} />
                </Tabs>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Vertical Tabs</Typography>
                <Tabs
                  value={0}
                  orientation="vertical"
                  sx={{ borderRight: 1, borderColor: 'divider' }}
                >
                  <Tab label="Tab 1" />
                  <Tab label="Tab 2" />
                  <Tab label="Tab 3" />
                </Tabs>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Pagination */}
      <Typography variant="h4" gutterBottom>Pagination</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Standard Pagination</Typography>
            <Stack spacing={3}>
              <Typography>Page: {page}</Typography>
              <Pagination
                count={10}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
              <Pagination
                count={10}
                page={page}
                onChange={handlePageChange}
                color="secondary"
              />
              <Pagination
                count={10}
                page={page}
                onChange={handlePageChange}
                disabled
              />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Pagination Variations</Typography>
            <Stack spacing={3}>
              <Typography variant="subtitle2">Sized Pagination</Typography>
              <Pagination
                count={10}
                size="small"
                page={page}
                onChange={handlePageChange}
              />
              <Pagination
                count={10}
                size="large"
                page={page}
                onChange={handlePageChange}
              />

              <Typography variant="subtitle2" gutterBottom>Show First/Last</Typography>
              <Pagination
                count={10}
                showFirstButton
                showLastButton
                page={page}
                onChange={handlePageChange}
              />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Menus */}
      <Typography variant="h4" gutterBottom>Menus</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Menu Components</Typography>
            <Stack spacing={3}>
              <Button
                variant="contained"
                startIcon={<span>☰</span>}
                onClick={handleMenuClick}
              >
                Open Menu
              </Button>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <Home fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Home</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <Folder fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Projects</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleMenuClose}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>

              <Button
                variant="outlined"
                startIcon={<MoreVert />}
                onClick={handleMenuClick}
              >
                More Options
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Navigation Menu</Typography>
            <List>
              <ListItem button>
                <ListItemIcon>
                  <Home />
                </ListItemIcon>
                <ListItemText primary="Dashboard" secondary="Main overview" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <Folder />
                </ListItemIcon>
                <ListItemText primary="Projects" secondary="Active projects" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <Description />
                </ListItemIcon>
                <ListItemText primary="Reports" secondary="Generate reports" />
              </ListItem>
              <Divider />
              <ListItem button>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText primary="Settings" secondary="Application settings" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <Help />
                </ListItemIcon>
                <ListItemText primary="Help" secondary="Get help and support" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* App Bar */}
      <Typography variant="h4" gutterBottom>App Bar & Navigation</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 0 }}>
            <AppBar position="static" color="default" elevation={1}>
              <Toolbar>
                <IconButton edge="start" sx={{ mr: 2 }}>
                  <span>☰</span>
                </IconButton>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  VerifyWise
                </Typography>
                <IconButton sx={{ mr: 1 }}>
                  <Search />
                </IconButton>
                <IconButton sx={{ mr: 1 }}>
                  <Notifications />
                </IconButton>
                <IconButton>
                  <AccountCircle />
                </IconButton>
              </Toolbar>
            </AppBar>
          </Paper>
        </Grid>
      </Grid>

      {/* Stepper */}
      <Typography variant="h4" gutterBottom>Stepper Navigation</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Horizontal Stepper</Typography>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Project Setup</StepLabel>
              </Step>
              <Step>
                <StepLabel>Configuration</StepLabel>
              </Step>
              <Step>
                <StepLabel>Review</StepLabel>
              </Step>
              <Step>
                <StepLabel>Complete</StepLabel>
              </Step>
            </Stepper>
            <Stack direction="row" spacing={2}>
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(activeStep - 1)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(activeStep + 1)}
                disabled={activeStep === 3}
              >
                {activeStep === 3 ? 'Finish' : 'Next'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Vertical Stepper</Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              <Step>
                <StepLabel>Basic Information</StepLabel>
                <StepContent>
                  <Typography>Enter basic project details</Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Team Members</StepLabel>
                <StepContent>
                  <Typography>Add team members to the project</Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Permissions</StepLabel>
                <StepContent>
                  <Typography>Set up access permissions</Typography>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>
      </Grid>

      {/* View Toggle */}
      <Typography variant="h4" gutterBottom>View Controls</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Toggle Group</Typography>
            <Stack spacing={3}>
              <Typography variant="subtitle2">View Options</Typography>
              <ToggleButtonGroup
                value={view}
                exclusive
                onChange={(e, newView) => newView && setView(newView)}
                aria-label="view"
              >
                <ToggleButton value="list" aria-label="list">
                  <ViewList />
                </ToggleButton>
                <ToggleButton value="module" aria-label="module">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="quilt" aria-label="quilt">
                  <ViewQuilt />
                </ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="subtitle2">Alignment Options</Typography>
              <ToggleButtonGroup
                value="left"
                exclusive
                aria-label="alignment"
              >
                <ToggleButton value="left" aria-label="left aligned">
                  <ArrowBack />
                </ToggleButton>
                <ToggleButton value="center" aria-label="centered">
                  <ArrowForward />
                </ToggleButton>
                <ToggleButton value="right" aria-label="right aligned">
                  <FirstPage />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Navigation Controls</Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => setDrawerOpen(true)}
              >
                Open Sidebar
              </Button>

              <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              >
                <Box sx={{ width: 250, p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Navigation Menu
                  </Typography>
                  <List>
                    {['Dashboard', 'Projects', 'Reports', 'Settings'].map((text) => (
                      <ListItem button key={text}>
                        <ListItemText primary={text} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Drawer>

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<FirstPage />}>
                  First
                </Button>
                <Button variant="outlined" startIcon={<ArrowBack />}>
                  Previous
                </Button>
                <Button variant="outlined" endIcon={<ArrowForward />}>
                  Next
                </Button>
                <Button variant="outlined" endIcon={<LastPage />}>
                  Last
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Navigation Guidelines */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>Navigation Design Guidelines</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Hierarchy & Flow</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Clear information architecture</Typography>
              <Typography variant="body2">• Logical grouping of related items</Typography>
              <Typography variant="body2">• Consistent navigation patterns</Typography>
              <Typography variant="body2">• Breadcrumb trails for deep navigation</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Accessibility</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Keyboard navigation support</Typography>
              <Typography variant="body2">• Screen reader compatibility</Typography>
              <Typography variant="body2">• High contrast color schemes</Typography>
              <Typography variant="body2">• Focus indicators for all elements</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Responsive Design</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Mobile-first approach</Typography>
              <Typography variant="body2">• Collapsible navigation menus</Typography>
              <Typography variant="body2">• Touch-friendly targets (44px+)</Typography>
              <Typography variant="body2">• Progressive disclosure</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      </Container>
    </ShowcaseLayout>
  );
};

export default NavigationShowcase;