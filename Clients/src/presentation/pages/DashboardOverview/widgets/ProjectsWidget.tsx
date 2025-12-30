import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Skeleton,
  useTheme,
} from '@mui/material';
import { DashboardProject, DashboardProjectsWidgetProps } from '../../../types/interfaces/i.dashboard';

export const ProjectsWidget: React.FC<DashboardProjectsWidgetProps> = ({
  loading = false,
  projects = [],
}) => {
  const theme = useTheme();

  // Default sample data
  const defaultProjects: DashboardProject[] = [
    { id: '1', name: 'AI Governance Framework', progress: 75, status: 'active', dueDate: '2024-03-15' },
    { id: '2', name: 'Risk Assessment Q1', progress: 45, status: 'active', dueDate: '2024-02-28' },
    { id: '3', name: 'Compliance Audit 2024', progress: 90, status: 'active', dueDate: '2024-02-10' },
    { id: '4', name: 'Security Review', progress: 30, status: 'pending', dueDate: '2024-04-01' },
  ];

  const projectList = projects.length > 0 ? projects : defaultProjects;

  const getStatusColor = (status: DashboardProject['status']) => {
    switch (status) {
      case 'active': return 'primary';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'on-hold': return 'default';
      default: return 'default';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return theme.palette.success.main;
    if (progress >= 50) return theme.palette.info.main;
    if (progress >= 25) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (loading) {
    return (
      <List sx={{ py: 0 }}>
        {[1, 2, 3].map((i) => (
          <ListItem key={i} sx={{ px: 0 }}>
            <ListItemText
              primary={<Skeleton variant="text" width="70%" />}
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="rectangular" height={4} sx={{ mt: 1 }} />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  }

  return (
    <List sx={{ py: 0 }}>
      {projectList.map((project) => (
        <ListItem key={project.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {project.name}
              </Typography>
              {project.dueDate && (
                <Typography variant="caption" color="text.secondary">
                  Due: {new Date(project.dueDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            <Chip
              label={project.status}
              size="small"
              color={getStatusColor(project.status)}
              sx={{ ml: 1, textTransform: 'capitalize' }}
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {project.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={project.progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: getProgressColor(project.progress),
                },
              }}
            />
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default ProjectsWidget;