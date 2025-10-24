import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Stack,
  Avatar,
  IconButton,
  Alert,
  Breadcrumbs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  RadioGroup,
  Radio,
  FormControlLabel,
  Switch,
  Pagination,
  Tab,
  Tabs,
  LinearProgress,
  CircularProgress,
  Skeleton,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ShowcaseLayout from '../ShowcaseLayout';

// Component Categories
const componentCategories = [
  {
    id: 'buttons',
    title: 'Buttons & Inputs',
    description: 'Interactive elements for user input and actions',
    components: ['Button', 'IconButton', 'FilterButton', 'CustomizableButton', 'ButtonToggle'],
    color: '#1976d2'
  },
  {
    id: 'cards',
    title: 'Cards & Displays',
    description: 'Content containers and display components',
    components: ['StatsCard', 'ProjectCard', 'InfoCard', 'RiskMetricsCard', 'TaskRadarCard', 'TeamCard'],
    color: '#2e7d32'
  },
  {
    id: 'forms',
    title: 'Forms & Controls',
    description: 'Form inputs and validation components',
    components: ['TextField', 'Select', 'Checkbox', 'Radio', 'Datepicker', 'FileUpload', 'Autocomplete'],
    color: '#ed6c02'
  },
  {
    id: 'tables',
    title: 'Tables & Data',
    description: 'Data presentation and table components',
    components: ['ReportTable', 'RisksTable', 'TasksTable', 'EventsTable', 'PolicyTable', 'EvaluationTable'],
    color: '#9c27b0'
  },
  {
    id: 'navigation',
    title: 'Navigation & Layout',
    description: 'Navigation, layout, and structural components',
    components: ['Sidebar', 'Breadcrumbs', 'Menu', 'Drawer', 'Tabs', 'Pagination', 'Search'],
    color: '#d32f2f'
  },
  {
    id: 'feedback',
    title: 'Feedback & Status',
    description: 'User feedback and status indication components',
    components: ['Alert', 'Toast', 'Skeleton', 'CircularProgress', 'LinearProgress', 'StatusDropdown'],
    color: '#0288d1'
  },
  {
    id: 'modals',
    title: 'Modals & Overlays',
    description: 'Dialogs, modals, and overlay components',
    components: ['Dialog', 'Modal', 'Banner', 'ConfirmableDeleteIconButton', 'Controlpane'],
    color: '#7b1fa2'
  },
  {
    id: 'misc',
    title: 'Utilities & Misc',
    description: 'Utility components and miscellaneous UI elements',
    components: ['Avatar', 'Chip', 'Tooltip', 'HelperIcon', 'EmptyState', 'PageTour'],
    color: '#455a64'
  }
];

const ComponentShowcase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('buttons');
  const [demoData, setDemoData] = useState({
    textInput: '',
    selectValue: '',
    checkboxChecked: false,
    radioValue: 'option1',
    switchOn: false,
    paginationPage: 1,
    tabValue: 0,
    menuOpen: false,
    drawerOpen: false,
    dialogOpen: false,
  });

  const renderButtonShowcase = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Standard Buttons</Typography>
          <Stack spacing={2} direction="column" alignItems="flex-start">
            <Button variant="contained" color="primary">Primary Button</Button>
            <Button variant="outlined" color="primary">Outlined Button</Button>
            <Button variant="text" color="primary">Text Button</Button>
            <Button disabled>Disabled Button</Button>
            <Button variant="contained" color="secondary">Secondary Button</Button>
            <Button variant="contained" color="error">Error Button</Button>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Icon Buttons</Typography>
          <Stack spacing={2} direction="row" alignItems="center">
            <IconButton color="primary">
              <Avatar>📱</Avatar>
            </IconButton>
            <IconButton color="secondary">
              <Avatar>⚙️</Avatar>
            </IconButton>
            <IconButton disabled>
              <Avatar>🔒</Avatar>
            </IconButton>
            <IconButton>
              <Avatar>👤</Avatar>
            </IconButton>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Button Variations</Typography>
          <Stack spacing={2} direction="row" flexWrap="wrap" gap={2}>
            <Button size="small">Small</Button>
            <Button size="medium">Medium</Button>
            <Button size="large">Large</Button>
            <Button variant="contained" fullWidth>Full Width</Button>
            <Button variant="outlined" startIcon="📎">With Icon</Button>
            <Button variant="contained" endIcon="→">With End Icon</Button>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFormsShowcase = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Text Inputs</Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Standard Input"
              value={demoData.textInput}
              onChange={(e) => setDemoData({...demoData, textInput: e.target.value})}
            />
            <TextField
              fullWidth
              label="Password Input"
              type="password"
              defaultValue="password123"
            />
            <TextField
              fullWidth
              label="Multiline Input"
              multiline
              rows={3}
              defaultValue="This is a multiline text field"
            />
            <TextField
              fullWidth
              label="Disabled Input"
              disabled
              defaultValue="Disabled field"
            />
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Select Inputs</Typography>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Standard Select</InputLabel>
              <Select
                value={demoData.selectValue}
                label="Standard Select"
                onChange={(e) => setDemoData({...demoData, selectValue: e.target.value})}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
                <MenuItem value="option3">Option 3</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Multiple Select</InputLabel>
              <Select multiple value={['option1']} label="Multiple Select">
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
                <MenuItem value="option3">Option 3</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Checkboxes & Radio</Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={demoData.checkboxChecked}
                  onChange={(e) => setDemoData({...demoData, checkboxChecked: e.target.checked})}
                />
              }
              label="Standard Checkbox"
            />
            <FormControlLabel control={<Checkbox defaultChecked />} label="Checked Checkbox" />
            <FormControlLabel control={<Checkbox disabled />} label="Disabled Checkbox" />
            <Divider />
            <RadioGroup
              value={demoData.radioValue}
              onChange={(e) => setDemoData({...demoData, radioValue: e.target.value})}
            >
              <FormControlLabel value="option1" control={<Radio />} label="Option 1" />
              <FormControlLabel value="option2" control={<Radio />} label="Option 2" />
              <FormControlLabel value="option3" control={<Radio />} label="Option 3" />
            </RadioGroup>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Toggles & Switches</Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={demoData.switchOn}
                  onChange={(e) => setDemoData({...demoData, switchOn: e.target.checked})}
                />
              }
              label="Standard Switch"
            />
            <FormControlLabel control={<Switch defaultChecked />} label="Checked Switch" />
            <FormControlLabel control={<Switch disabled />} label="Disabled Switch" />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderFeedbackShowcase = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Alerts</Typography>
          <Stack spacing={2}>
            <Alert severity="success">Success: Operation completed successfully!</Alert>
            <Alert severity="info">Info: Here is some important information.</Alert>
            <Alert severity="warning">Warning: Please review your input.</Alert>
            <Alert severity="error">Error: Something went wrong!</Alert>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Progress Indicators</Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" gutterBottom>Linear Progress</Typography>
              <LinearProgress variant="determinate" value={65} />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>Circular Progress</Typography>
              <CircularProgress value={65} variant="determinate" />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>Indeterminate</Typography>
              <LinearProgress />
            </Box>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Loading Skeletons</Typography>
          <Grid container spacing={2}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Box>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="40%" sx={{ mt: 1 }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderTablesShowcase = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Data Tables</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { name: 'Project Alpha', status: 'Active', progress: 75 },
                  { name: 'Project Beta', status: 'Pending', progress: 30 },
                  { name: 'Project Gamma', status: 'Completed', progress: 100 },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={row.status === 'Active' ? 'primary' : row.status === 'Completed' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <LinearProgress variant="determinate" value={row.progress} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button size="small">Edit</Button>
                        <Button size="small" color="error">Delete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderNavigationShowcase = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Breadcrumbs</Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Button color="inherit" size="small">Home</Button>
            <Button color="inherit" size="small">Projects</Button>
            <Typography color="text.primary">Current Page</Typography>
          </Breadcrumbs>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Tabs</Typography>
          <Tabs value={demoData.tabValue} onChange={(e, newValue) => setDemoData({...demoData, tabValue: newValue})}>
            <Tab label="Overview" />
            <Tab label="Details" />
            <Tab label="Settings" />
          </Tabs>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Pagination</Typography>
          <Stack spacing={2} alignItems="center">
            <Typography>Page {demoData.paginationPage} of 10</Typography>
            <Pagination
              count={10}
              page={demoData.paginationPage}
              onChange={(e, value) => setDemoData({...demoData, paginationPage: value})}
              color="primary"
            />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderCardsShowcase = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Stats Card</Typography>
            <Typography variant="h4" color="primary">1,234</Typography>
            <Typography variant="body2" color="text.secondary">Total Items</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Progress Card</Typography>
            <LinearProgress variant="determinate" value={65} sx={{ mt: 1, mb: 1 }} />
            <Typography variant="body2">65% Complete</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Status Card</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar sx={{ bgcolor: 'success.main' }}>✓</Avatar>
              <Typography>All Systems Operational</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderModalsShowcase = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Modal Triggers</Typography>
          <Stack spacing={2} direction="row">
            <Button
              variant="contained"
              onClick={() => setDemoData({...demoData, dialogOpen: true})}
            >
              Open Dialog
            </Button>
            <Button
              variant="outlined"
              onClick={() => setDemoData({...demoData, drawerOpen: true})}
            >
              Open Drawer
            </Button>
            <Button variant="text">
              Tooltip Example
            </Button>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Banner Components</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Information Banner</Typography>
            <Typography variant="body2">This is an informational message banner.</Typography>
          </Alert>
          <Alert severity="warning">
            <Typography variant="subtitle2">Warning Banner</Typography>
            <Typography variant="body2">Please review this important warning.</Typography>
          </Alert>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderMiscShowcase = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Avatars</Typography>
          <Stack spacing={2} direction="row" alignItems="center">
            <Avatar>U</Avatar>
            <Avatar sx={{ bgcolor: 'primary.main' }}>JD</Avatar>
            <Avatar src="/static/images/avatar/1.jpg" />
            <Avatar variant="square">SQ</Avatar>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Chips</Typography>
          <Stack spacing={1} direction="row" flexWrap="wrap">
            <Chip label="Default" />
            <Chip label="Primary" color="primary" />
            <Chip label="Secondary" color="secondary" />
            <Chip label="Success" color="success" />
            <Chip label="Error" color="error" />
            <Chip label="With Delete" onDelete={() => {}} />
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Empty States</Typography>
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">No Data Available</Typography>
            <Typography variant="body2" color="text.secondary">
              There are no items to display at this time.
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>Add First Item</Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case 'buttons':
        return renderButtonShowcase();
      case 'forms':
        return renderFormsShowcase();
      case 'feedback':
        return renderFeedbackShowcase();
      case 'tables':
        return renderTablesShowcase();
      case 'navigation':
        return renderNavigationShowcase();
      case 'cards':
        return renderCardsShowcase();
      case 'modals':
        return renderModalsShowcase();
      case 'misc':
        return renderMiscShowcase();
      default:
        return renderButtonShowcase();
    }
  };

  return (
    <ShowcaseLayout title="Component Showcase" currentPage="/component-showcase">
      <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Component Showcase
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Comprehensive overview of all UI components available in the VerifyWise design system.
      </Typography>

      {/* Category Navigation */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {componentCategories.map((category) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedCategory === category.id ? `2px solid ${category.color}` : '1px solid #e0e0e0',
                '&:hover': {
                  boxShadow: 3,
                }
              }}
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: category.color }}>
                  {category.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {category.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {category.components.length} components
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Category Content */}
      <Typography variant="h4" gutterBottom>
        {componentCategories.find(cat => cat.id === selectedCategory)?.title}
      </Typography>

      {renderCategoryContent()}

      {/* Dialog */}
      <Dialog
        open={demoData.dialogOpen}
        onClose={() => setDemoData({...demoData, dialogOpen: false})}
      >
        <DialogTitle>Example Dialog</DialogTitle>
        <DialogContent>
          <Typography>This is an example dialog component.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDemoData({...demoData, dialogOpen: false})}>Cancel</Button>
          <Button variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={demoData.drawerOpen}
        onClose={() => setDemoData({...demoData, drawerOpen: false})}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>Example Drawer</Typography>
          <Typography>This is an example drawer component.</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => setDemoData({...demoData, drawerOpen: false})}
          >
            Close
          </Button>
        </Box>
      </Drawer>

      {/* Design System Documentation */}
      <Paper sx={{ p: 4, mt: 6, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Design System Documentation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Complete reference for all component heights, spacing, typography, and design tokens
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Component Standards</Typography>
            <Stack spacing={2}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2">Button Heights:</Typography>
                <Typography variant="body2">Small: 28px, Medium: 32px, Large: 40px</Typography>
              </Box>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2">Typography Scale:</Typography>
                <Typography variant="body2">12px-14px for body, 16px-24px for headings</Typography>
              </Box>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2">Spacing System:</Typography>
                <Typography variant="body2">4px base unit, multiples of 4px</Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Color Palette</Typography>
            <Stack spacing={2}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2">Primary Colors:</Typography>
                <Typography variant="body2">#1976d2 (Primary), #13715B (VerifyWise Green)</Typography>
              </Box>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2">Status Colors:</Typography>
                <Typography variant="body2">Success: #2e7d32, Warning: #ed6c02, Error: #d32f2f</Typography>
              </Box>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2">Neutral Colors:</Typography>
                <Typography variant="body2">Grayscale from #f5f5f5 to #212121</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      </Container>
    </ShowcaseLayout>
  );
};

export default ComponentShowcase;