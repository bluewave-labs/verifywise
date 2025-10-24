import React, { useState } from 'react';
import ShowcaseLayout from '../ShowcaseLayout';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Alert,
  AlertTitle,
  Snackbar,
  Stack,
  Button,
  LinearProgress,
  CircularProgress,
  Skeleton,
  Chip,
  Tooltip,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Slider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
  Notifications,
  ThumbUp,
  ThumbDown,
  Star,
  Refresh,
  CloudUpload,
  Download,
  Settings,
  Help,
  TaskAlt,
// Icons using Lucide React inline components

interface FeedbackItem {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

const FeedbackShowcase: React.FC = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(3);
  const [sliderValue, setSliderValue] = useState(50);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);

  const feedbackHistory: FeedbackItem[] = [
    {
      id: 1,
      type: 'success',
      title: 'Project Created Successfully',
      message: 'Your new project has been created and is ready for configuration.',
      timestamp: '2 minutes ago'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Storage Space Low',
      message: 'You have used 85% of your available storage space.',
      timestamp: '15 minutes ago'
    },
    {
      id: 3,
      type: 'error',
      title: 'Upload Failed',
      message: 'The file could not be uploaded due to size limitations.',
      timestamp: '1 hour ago'
    },
    {
      id: 4,
      type: 'info',
      title: 'System Update Available',
      message: 'A new system update is available for installation.',
      timestamp: '2 hours ago'
    }
  ];

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <ShowcaseLayout title="Feedback & Status" currentPage="/feedback-showcase">
      <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Feedback & Status Components
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Complete reference for alerts, notifications, progress indicators, and user feedback components.
      </Typography>

      {/* Alert Messages */}
      <Typography variant="h4" gutterBottom>Alert Messages</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Standard Alerts</Typography>
            <Stack spacing={2}>
              <Alert severity="success">
                <AlertTitle>Success</AlertTitle>
                Operation completed successfully! Your changes have been saved.
              </Alert>
              <Alert severity="warning">
                <AlertTitle>Warning</AlertTitle>
                Please review your input. Some fields may be incorrect.
              </Alert>
              <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                Something went wrong. Please try again later.
              </Alert>
              <Alert severity="info">
                <AlertTitle>Information</AlertTitle>
                Here is some important information about your account.
              </Alert>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Alert Variations</Typography>
            <Stack spacing={2}>
              <Alert severity="success" icon={<CheckCircle fontSize="inherit" />}>
                Simple success message without title
              </Alert>
              <Alert severity="warning" action={
                <Button color="inherit" size="small">
                  Dismiss
                </Button>
              }>
                Warning with action button
              </Alert>
              <Alert severity="error" variant="filled">
                Filled error style for more emphasis
              </Alert>
              <Alert severity="info" variant="outlined">
                Outlined info style
              </Alert>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Progress Indicators */}
      <Typography variant="h4" gutterBottom>Progress Indicators</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Linear Progress</Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" gutterBottom>Upload Progress: 65%</Typography>
                <LinearProgress variant="determinate" value={65} />
              </Box>
              <Box>
                <Typography variant="body2" gutterBottom>Processing: 45%</Typography>
                <LinearProgress variant="determinate" value={45} color="secondary" />
              </Box>
              <Box>
                <Typography variant="body2" gutterBottom>Indeterminate Loading</Typography>
                <LinearProgress />
              </Box>
              <Box>
                <Typography variant="body2" gutterBottom>Buffer Progress</Typography>
                <LinearProgress variant="buffer" value={60} valueBuffer={80} />
              </Box>
              <LinearProgress variant="determinate" value={80} sx={{ height: 8, borderRadius: 4 }} />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Circular Progress</Typography>
            <Stack spacing={3} alignItems="center">
              <Box textAlign="center">
                <CircularProgress value={75} variant="determinate" />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  75% Complete
                </Typography>
              </Box>
              <Stack direction="row" spacing={3} alignItems="center">
                <CircularProgress color="secondary" />
                <CircularProgress color="success" />
                <CircularProgress color="error" />
              </Stack>
              <Box>
                <Typography variant="body2" gutterBottom>Indeterminate</Typography>
                <CircularProgress />
              </Box>
              <Box>
                <Typography variant="body2" gutterBottom>Sized Progress</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={20} />
                  <CircularProgress size={40} />
                  <CircularProgress size={60} />
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Loading States */}
      <Typography variant="h4" gutterBottom>Loading States</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Skeleton Loading</Typography>
            <Stack spacing={2}>
              <Box>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="rectangular" height={60} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Card Skeleton</Typography>
                <Skeleton variant="rectangular" height={120} />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>List Skeleton</Typography>
                {[1, 2, 3].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="70%" />
                      <Skeleton variant="text" width="50%" />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Loading Actions</Typography>
            <Stack spacing={3}>
              <Button
                variant="contained"
                onClick={handleLoadingDemo}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
              >
                {loading ? 'Processing...' : 'Start Processing'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Upload File
              </Button>

              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={24} />
                <Typography>Saving changes...</Typography>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={20} color="secondary" />
                <Typography variant="body2">Loading data...</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Notifications */}
      <Typography variant="h4" gutterBottom>Notifications</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Notification Badges</Typography>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <Badge badgeContent={4} color="primary">
                  <Notifications />
                </Badge>
                <Badge badgeContent={99} color="secondary">
                  <Settings />
                </Badge>
                <Badge badgeContent={1} color="error">
                  <Help />
                </Badge>
                <Badge badgeContent={0} showZero color="info">
                  <Download />
                </Badge>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Badge badgeContent={notifications} color="primary">
                  <Button variant="contained">Notifications</Button>
                </Badge>
                <Button
                  variant="outlined"
                  onClick={() => setNotifications(Math.max(0, notifications - 1))}
                >
                  Clear One
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setNotifications(0)}
                >
                  Clear All
                </Button>
              </Stack>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Dot Badge</Typography>
                <Stack direction="row" spacing={2}>
                  <Badge color="primary" variant="dot">
                    <Button>Messages</Button>
                  </Badge>
                  <Badge color="secondary" variant="dot">
                    <Button>Updates</Button>
                  </Badge>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Notification History</Typography>
            <List>
              {feedbackHistory.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon>
                      {item.type === 'success' && <CheckCircle color="success" />}
                      {item.type === 'warning' && <Warning color="warning" />}
                      {item.type === 'error' && <Error color="error" />}
                      {item.type === 'info' && <Info color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {item.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.timestamp}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < feedbackHistory.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Feedback Components */}
      <Typography variant="h4" gutterBottom>Feedback Components</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Rating & Feedback</Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Product Rating</Typography>
                <Rating
                  value={ratingValue}
                  onChange={(e, newValue) => setRatingValue(newValue || 0)}
                  size="large"
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {ratingValue} out of 5 stars
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Read-only Rating</Typography>
                <Rating value={4} readOnly />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>Precision Rating</Typography>
                <Rating
                  value={3.5}
                  precision={0.5}
                  readOnly
                />
              </Box>

              <Stack direction="row" spacing={2}>
                <Button variant="outlined" startIcon={<ThumbUp />}>
                  Helpful
                </Button>
                <Button variant="outlined" startIcon={<ThumbDown />}>
                  Not Helpful
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Interactive Feedback</Typography>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Satisfaction Level: {sliderValue}%
                </Typography>
                <Slider
                  value={sliderValue}
                  onChange={(e, value) => setSliderValue(value as number)}
                  step={10}
                  marks
                  min={0}
                  max={100}
                  valueLabelDisplay="on"
                />
              </Box>

              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable notifications"
              />

              <FormControlLabel
                control={<Switch />}
                label="Email updates"
              />

              <Button
                variant="contained"
                onClick={() => setDialogOpen(true)}
              >
                Provide Detailed Feedback
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Typography variant="h4" gutterBottom>Floating Action Buttons</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, minHeight: 200, position: 'relative' }}>
            <Typography variant="h6" gutterBottom>FAB Examples</Typography>
            <Typography paragraph>
              Floating Action Buttons are positioned relative to their container:
            </Typography>

            <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
              <Fab color="primary" aria-label="add">
                <CheckCircle />
              </Fab>
            </Box>

            <Box sx={{ position: 'absolute', bottom: 16, right: 80 }}>
              <Fab color="secondary" aria-label="edit" size="small">
                <Star />
              </Fab>
            </Box>

            <Box sx={{ position: 'absolute', bottom: 80, right: 16 }}>
              <Fab variant="extended">
                <Notifications sx={{ mr: 1 }} />
                Alert
              </Fab>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Feedback Guidelines */}
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>Feedback Design Guidelines</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Alert Principles</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Use appropriate severity levels</Typography>
              <Typography variant="body2">• Provide clear, actionable messages</Typography>
              <Typography variant="body2">• Include dismiss options</Typography>
              <Typography variant="body2">• Avoid alert fatigue</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Progress Feedback</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Show progress for long operations</Typography>
              <Typography variant="body2">• Provide estimated completion times</Typography>
              <Typography variant="body2">• Use skeleton loading for content</Typography>
              <Typography variant="body2">• Offer cancel options when possible</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>User Experience</Typography>
            <Stack spacing={1}>
              <Typography variant="body2">• Use non-intrusive notifications</Typography>
              <Typography variant="body2">• Group related feedback</Typography>
              <Typography variant="body2">• Provide context and timing</Typography>
              <Typography variant="body2">• Allow user control over preferences</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message="Operation completed successfully!"
        action={
          <Button color="inherit" size="small" onClick={() => setSnackbarOpen(false)}>
            Dismiss
          </Button>
        }
      />

      {/* Feedback Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Provide Feedback</DialogTitle>
        <DialogContent>
          <Typography>
            Help us improve by providing your feedback about this experience.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Rate your experience</Typography>
            <Rating
              value={ratingValue}
              onChange={(e, newValue) => setRatingValue(newValue || 0)}
              size="large"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </ShowcaseLayout>
  );
};

export default FeedbackShowcase;