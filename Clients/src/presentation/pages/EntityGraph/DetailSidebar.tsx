import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import {
  X,
  ExternalLink,
  AlertTriangle,
  User,
  Calendar,
  Link as LinkIcon,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface EntityDetails {
  id: string;
  entityType: 'project' | 'model' | 'modelRisk' | 'vendor' | 'vendorRisk' | 'projectRisk' | 'framework';
  label: string;
  sublabel?: string;
  color: string;
  status?: string;
  riskLevel?: string;
  // Extended data from API
  rawData?: Record<string, unknown>;
  connectedEntities?: {
    type: string;
    count: number;
    items: Array<{ id: string; label: string }>;
  }[];
}

interface DetailSidebarProps {
  entity: EntityDetails | null;
  onClose: () => void;
  onNavigateToEntity: (entityType: string, id: string) => void;
}

const entityTypeLabels: Record<string, string> = {
  project: 'Use case',
  model: 'Model',
  modelRisk: 'Model risk',
  vendor: 'Vendor',
  vendorRisk: 'Vendor risk',
  projectRisk: 'Project risk',
  framework: 'Framework',
};

const entityRoutes: Record<string, string> = {
  project: '/project-view',
  model: '/model-inventory',
  modelRisk: '/model-inventory',
  vendor: '/vendors',
  vendorRisk: '/vendors',
  projectRisk: '/risk-management',
  framework: '/framework',
};

const riskLevelColors: Record<string, string> = {
  'Low': '#4caf50',
  'Medium': '#ff9800',
  'High': '#f44336',
  'Critical': '#9c27b0',
  'Very low risk': '#4caf50',
  'Low risk': '#8bc34a',
  'Medium risk': '#ff9800',
  'High risk': '#f44336',
  'Very high risk': '#9c27b0',
};

const statusColors: Record<string, string> = {
  'Approved': '#4caf50',
  'Pending': '#ff9800',
  'Restricted': '#f44336',
  'Blocked': '#9c27b0',
  'Open': '#2196f3',
  'In Progress': '#ff9800',
  'Resolved': '#4caf50',
  'Accepted': '#8bc34a',
  'Not started': '#9e9e9e',
  'In review': '#ff9800',
  'Reviewed': '#4caf50',
  'Requires follow-up': '#f44336',
};

const DetailSidebar: React.FC<DetailSidebarProps> = ({
  entity,
  onClose,
  onNavigateToEntity,
}) => {
  const navigate = useNavigate();

  if (!entity) return null;

  const handleGoToEntity = () => {
    const route = entityRoutes[entity.entityType];
    if (route) {
      // Extract numeric ID from entity id (e.g., "project-1" -> "1")
      const numericId = entity.id.split('-').slice(1).join('-');
      navigate(`${route}?id=${numericId}`);
    }
  };

  const rawData = entity.rawData || {};

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 360,
        height: '100%',
        backgroundColor: 'white',
        borderLeft: '1px solid #d0d5dd',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #d0d5dd',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '4px',
            backgroundColor: entity.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
            {entity.label.charAt(0).toUpperCase()}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 11,
              color: '#667085',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              mb: 0.25,
            }}
          >
            {entityTypeLabels[entity.entityType]}
          </Typography>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: '#101828',
              wordBreak: 'break-word',
            }}
          >
            {entity.label}
          </Typography>
          {entity.sublabel && (
            <Typography sx={{ fontSize: 13, color: '#667085' }}>
              {entity.sublabel}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
          <X size={18} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Status/Risk Level */}
        {(entity.status || entity.riskLevel) && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 12, color: '#667085', mb: 0.5 }}>
              {entity.riskLevel ? 'Risk level' : 'Status'}
            </Typography>
            <Chip
              size="small"
              label={entity.riskLevel || entity.status}
              sx={{
                backgroundColor:
                  riskLevelColors[entity.riskLevel || ''] ||
                  statusColors[entity.status || ''] ||
                  '#e0e0e0',
                color: 'white',
                fontWeight: 500,
                fontSize: 12,
              }}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Quick Info */}
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#344054', mb: 1.5 }}>
          Details
        </Typography>

        <Stack spacing={1.5}>
          {Boolean(rawData.owner) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <User size={14} color="#667085" />
              <Typography sx={{ fontSize: 13, color: '#667085' }}>Owner:</Typography>
              <Typography sx={{ fontSize: 13, color: '#344054' }}>
                {String(rawData.owner)}
              </Typography>
            </Box>
          )}

          {Boolean(rawData.target_date) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={14} color="#667085" />
              <Typography sx={{ fontSize: 13, color: '#667085' }}>Target date:</Typography>
              <Typography sx={{ fontSize: 13, color: '#344054' }}>
                {new Date(String(rawData.target_date)).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          {Boolean(rawData.review_date) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={14} color="#667085" />
              <Typography sx={{ fontSize: 13, color: '#667085' }}>Review date:</Typography>
              <Typography sx={{ fontSize: 13, color: '#344054' }}>
                {new Date(String(rawData.review_date)).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          {Boolean(rawData.provider) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkIcon size={14} color="#667085" />
              <Typography sx={{ fontSize: 13, color: '#667085' }}>Provider:</Typography>
              <Typography sx={{ fontSize: 13, color: '#344054' }}>
                {String(rawData.provider)}
              </Typography>
            </Box>
          )}

          {Boolean(rawData.description) && (
            <Box>
              <Typography sx={{ fontSize: 13, color: '#667085', mb: 0.5 }}>
                Description:
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#344054', lineHeight: 1.5 }}>
                {String(rawData.description).substring(0, 200)}
                {String(rawData.description).length > 200 ? '...' : ''}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Connected Entities */}
        {entity.connectedEntities && entity.connectedEntities.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#344054', mb: 1.5 }}>
              Connected entities
            </Typography>
            <Stack spacing={1}>
              {entity.connectedEntities.map((connection) => (
                <Box
                  key={connection.type}
                  sx={{
                    p: 1.5,
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: '#667085', textTransform: 'capitalize' }}>
                      {connection.type.replace(/([A-Z])/g, ' $1').trim()}s
                    </Typography>
                    <Chip
                      size="small"
                      label={connection.count}
                      sx={{ height: 20, fontSize: 11, backgroundColor: '#e5e7eb' }}
                    />
                  </Box>
                  {connection.items.slice(0, 3).map((item) => (
                    <Box
                      key={item.id}
                      onClick={() => onNavigateToEntity(connection.type, item.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.5,
                        cursor: 'pointer',
                        '&:hover': { color: '#13715B' },
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: '#344054' }}>
                        {item.label}
                      </Typography>
                      <ChevronRight size={12} color="#667085" />
                    </Box>
                  ))}
                  {connection.items.length > 3 && (
                    <Typography sx={{ fontSize: 11, color: '#667085', mt: 0.5 }}>
                      +{connection.items.length - 3} more
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </>
        )}

        {/* Risk Warning */}
        {entity.riskLevel && ['High', 'Critical', 'High risk', 'Very high risk'].includes(entity.riskLevel) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                p: 1.5,
                backgroundColor: '#fef3f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                  High risk detected
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.4 }}>
                  This {entityTypeLabels[entity.entityType].toLowerCase()} requires immediate attention.
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #d0d5dd',
          display: 'flex',
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          fullWidth
          onClick={onClose}
          sx={{
            borderColor: '#d0d5dd',
            color: '#344054',
            textTransform: 'none',
            height: 34,
            '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
          }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          size="small"
          fullWidth
          onClick={handleGoToEntity}
          endIcon={<ExternalLink size={14} />}
          sx={{
            backgroundColor: '#13715B',
            textTransform: 'none',
            height: 34,
            '&:hover': { backgroundColor: '#0f5a48' },
          }}
        >
          Go to {entityTypeLabels[entity.entityType].toLowerCase()}
        </Button>
      </Box>
    </Box>
  );
};

export default DetailSidebar;
