import React from 'react';
import ShowcaseLayout from '../ShowcaseLayout';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  IconButton,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  MoreVert,
  TrendingUp,
  TrendingDown,
  People,
  Assessment,
  Warning,
  CheckCircle,
  Error,
  Info,
// Icons using Lucide React inline components

const CardsShowcase: React.FC = () => {
  return (
    <ShowcaseLayout title="Cards & Displays" currentPage="/cards-showcase">
      <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Cards & Display Components
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Complete reference for card layouts, data displays, and content containers.
      </Typography>

      {/* Stats Cards */}
      <Typography variant="h4" gutterBottom>Statistics Cards</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h4" color="primary">
                    1,234
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Projects
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <TrendingUp fontSize="small" color="success" />
                <Typography variant="caption" color="success.main">
                  +12% from last month
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" color="success.main">
                    892
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Tasks
                  </Typography>
                </Box>
              </Stack>
              <LinearProgress variant="determinate" value={72} sx={{ mt: 2 }} />
              <Typography variant="caption" color="text.secondary">
                72% completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Warning />
                </Avatar>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    45
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Risks
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <TrendingDown fontSize="small" color="success" />
                <Typography variant="caption" color="success.main">
                  -8% from last week
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4" color="info.main">
                    156
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Team Members
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <TrendingUp fontSize="small" color="success" />
                <Typography variant="caption" color="success.main">
                  +5 new this week
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project Cards */}
      <Typography variant="h4" gutterBottom>Project Cards</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  PA
                </Avatar>
              }
              action={
                <IconButton>
                  <MoreVert />
                </IconButton>
              }
              title="Project Alpha"
              subheader="Due: Dec 31, 2024"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                A comprehensive project to implement new security measures across all platforms.
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Progress: 75%
                  </Typography>
                  <LinearProgress variant="determinate" value={75} />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label="High Priority" color="error" size="small" />
                  <Chip label="Security" color="info" size="small" />
                </Stack>
              </Stack>
            </CardContent>
            <CardActions>
              <Button size="small">View Details</Button>
              <Button size="small" color="primary">
                Edit
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  PB
                </Avatar>
              }
              action={
                <IconButton>
                  <MoreVert />
                </IconButton>
              }
              title="Project Beta"
              subheader="Due: Nov 15, 2024"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                User interface redesign project focusing on improved user experience and accessibility.
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Progress: 45%
                  </Typography>
                  <LinearProgress variant="determinate" value={45} color="success" />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label="Medium Priority" color="warning" size="small" />
                  <Chip label="UX/UI" color="secondary" size="small" />
                </Stack>
              </Stack>
            </CardContent>
            <CardActions>
              <Button size="small">View Details</Button>
              <Button size="small" color="primary">
                Edit
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  PG
                </Avatar>
              }
              action={
                <IconButton>
                  <MoreVert />
                </IconButton>
              }
              title="Project Gamma"
              subheader="Due: Jan 31, 2025"
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Infrastructure migration to cloud-based solutions for better scalability and performance.
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Progress: 20%
                  </Typography>
                  <LinearProgress variant="determinate" value={20} color="secondary" />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label="Low Priority" color="default" size="small" />
                  <Chip label="Infrastructure" color="info" size="small" />
                </Stack>
              </Stack>
            </CardContent>
            <CardActions>
              <Button size="small">View Details</Button>
              <Button size="small" color="primary">
                Edit
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Status Cards */}
      <Typography variant="h4" gutterBottom>Status Cards</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid #4caf50', bgcolor: '#f8fff8' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircle sx={{ color: '#4caf50', fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" color="#4caf50">
                    System Operational
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All systems are running normally
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid #ff9800', bgcolor: '#fff8f0' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Warning sx={{ color: '#ff9800', fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" color="#ff9800">
                    Maintenance Mode
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled maintenance in progress
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid #f44336', bgcolor: '#fff5f5' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Error sx={{ color: '#f44336', fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" color="#f44336">
                    Service Unavailable
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Some services are experiencing issues
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Cards */}
      <Typography variant="h4" gutterBottom>Information Cards</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, border: '1px solid #e3f2fd', bgcolor: '#f8fbff' }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="primary" />
                <Typography variant="h6" color="primary">
                  Quick Tip
                </Typography>
              </Box>
              <Typography variant="body2">
                Use keyboard shortcuts to navigate faster through the application. Press Ctrl+K to open the command palette.
              </Typography>
              <Button variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
                Learn More
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, border: '1px solid #fff3e0', bgcolor: '#fffbf0' }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                <Typography variant="h6" color="warning.main">
                  Important Notice
                </Typography>
              </Box>
              <Typography variant="body2">
                System maintenance is scheduled for this weekend. Please save your work frequently.
              </Typography>
              <Button variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
                View Schedule
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* List Cards */}
      <Typography variant="h4" gutterBottom>List Cards</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Recent Activities"
              subheader="Latest updates and changes"
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ p: 0 }}>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Project Alpha completed"
                    secondary="2 hours ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Warning color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Security scan completed"
                    secondary="4 hours ago"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="New team member added"
                    secondary="1 day ago"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Upcoming Tasks"
              subheader="Tasks due this week"
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <List sx={{ p: 0 }}>
                <ListItem>
                  <ListItemIcon>
                    <Chip label="High" color="error" size="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Review security policies"
                    secondary="Due tomorrow"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Chip label="Medium" color="warning" size="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Update documentation"
                    secondary="Due in 3 days"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Chip label="Low" color="default" size="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Team meeting preparation"
                    secondary="Due in 5 days"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card Design Guidelines */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>Card Design Guidelines</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Sizing</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Minimum height: 120px</Typography>
              <Typography variant="body2">• Card spacing: 24px</Typography>
              <Typography variant="body2">• Border radius: 8px</Typography>
              <Typography variant="body2">• Padding: 16px internal</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Content Hierarchy</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Title: Typography h6</Typography>
              <Typography variant="body2">• Subtitle: Body2 color secondary</Typography>
              <Typography variant="body2">• Body text: Body1</Typography>
              <Typography variant="body2">• Actions: Button components</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Visual States</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Default: White background</Typography>
              <Typography variant="body2">• Hover: Elevation 8px</Typography>
              <Typography variant="body2">• Active: Primary border</Typography>
              <Typography variant="body2">• Disabled: 50% opacity</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      </Container>
    </ShowcaseLayout>
  );
};

export default CardsShowcase;