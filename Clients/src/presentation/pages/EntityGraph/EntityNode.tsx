import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Box, Typography, Tooltip } from '@mui/material';
import {
  Folder,
  Cpu,
  AlertTriangle,
  Building2,
  Shield,
  FileWarning,
  BookOpen,
} from 'lucide-react';

interface EntityNodeData {
  label: string;
  sublabel?: string;
  entityType: 'project' | 'model' | 'modelRisk' | 'vendor' | 'vendorRisk' | 'projectRisk' | 'framework';
  color: string;
  status?: string;
  riskLevel?: string;
}

const entityIcons = {
  project: Folder,
  model: Cpu,
  modelRisk: AlertTriangle,
  vendor: Building2,
  vendorRisk: Shield,
  projectRisk: FileWarning,
  framework: BookOpen,
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

const EntityNode: React.FC<NodeProps> = ({ data, sourcePosition, targetPosition }) => {
  const nodeData = data as unknown as EntityNodeData;
  const IconComponent = entityIcons[nodeData.entityType] || Folder;
  const isRiskNode = ['modelRisk', 'vendorRisk', 'projectRisk'].includes(nodeData.entityType);
  const riskColor = nodeData.riskLevel ? riskLevelColors[nodeData.riskLevel] : undefined;

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{nodeData.label}</Typography>
          {nodeData.sublabel && (
            <Typography variant="caption" sx={{ display: 'block' }}>{nodeData.sublabel}</Typography>
          )}
          {nodeData.status && (
            <Typography variant="caption" sx={{ display: 'block' }}>Status: {nodeData.status}</Typography>
          )}
          {nodeData.riskLevel && (
            <Typography variant="caption" sx={{ display: 'block' }}>Risk level: {nodeData.riskLevel}</Typography>
          )}
        </Box>
      }
      arrow
      placement="top"
    >
      <Box
        sx={{
          backgroundColor: 'white',
          border: `2px solid ${nodeData.color}`,
          borderRadius: '4px',
          padding: '8px 12px',
          minWidth: 120,
          maxWidth: 180,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        <Handle
          type="target"
          position={targetPosition || Position.Left}
          style={{
            background: nodeData.color,
            border: 'none',
            width: 8,
            height: 8,
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              backgroundColor: nodeData.color,
              borderRadius: '4px',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent size={14} color="white" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: 11,
                color: '#344054',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nodeData.label}
            </Typography>
            {nodeData.sublabel && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: 9,
                  color: '#667085',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nodeData.sublabel}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Status/Risk indicator */}
        {(nodeData.status || isRiskNode) && (
          <Box
            sx={{
              mt: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {nodeData.riskLevel && (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: riskColor || nodeData.color,
                }}
              />
            )}
            <Typography
              variant="caption"
              sx={{
                fontSize: 9,
                color: riskColor || '#667085',
                fontWeight: 500,
              }}
            >
              {nodeData.riskLevel || nodeData.status}
            </Typography>
          </Box>
        )}

        <Handle
          type="source"
          position={sourcePosition || Position.Right}
          style={{
            background: nodeData.color,
            border: 'none',
            width: 8,
            height: 8,
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default memo(EntityNode);
