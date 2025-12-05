import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Box, Typography } from '@mui/material';
import {
  FolderTree,
  List,
  AlertTriangle,
  Building2,
  Shield,
  FileText,
  BookOpen,
  User,
  AlertCircle,
  Calendar,
  Clock,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';
import VWTooltip from '../../components/VWTooltip';

export type EntityType = 'useCase' | 'model' | 'risk' | 'vendor' | 'control' | 'evidence' | 'framework' | 'user';

type GapSeverity = 'critical' | 'warning' | 'info';

interface GapResult {
  entityId: string;
  entityType: string;
  gaps: Array<{
    requirement: string;
    severity: GapSeverity;
    daysSinceCreation?: number;
  }>;
  highestSeverity: GapSeverity;
}

// Phase 6: Deadline status type
export type DeadlineStatus = 'overdue' | 'upcoming' | 'normal';

// Phase 6: Vendor tier type
export type VendorTier = 1 | 2 | 3;

interface EntityNodeData {
  label: string;
  sublabel?: string;
  entityType: EntityType;
  color: string;
  status?: string;
  riskLevel?: string;
  riskSource?: 'model' | 'project' | 'vendor';
  reviewDate?: string;
  evidenceCount?: number;
  gapResult?: GapResult;
  // Phase 6: Compliance features
  deadlineStatus?: DeadlineStatus;
  daysUntilDeadline?: number;
  evidenceFreshness?: 'fresh' | 'stale' | 'expired';
  lastEvidenceDate?: string;
  vendorTier?: VendorTier;
  hasAnnotation?: boolean;
  // Phase 7: Node sizing
  connectionCount?: number;
  // Focus highlight
  isHighlighted?: boolean;
}

// Gap severity colors
const gapSeverityColors: Record<GapSeverity, string> = {
  critical: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
};

// Gap requirement labels
const gapRequirementLabels: Record<string, string> = {
  has_risk: 'Missing risk assessment',
  has_control: 'Missing control',
  has_owner: 'Missing owner',
  has_evidence: 'Missing evidence',
  has_risk_assessment: 'Missing risk assessment',
  has_severity: 'Missing severity rating',
};

const entityIcons: Record<EntityType, LucideIcon> = {
  useCase: FolderTree,
  model: List,
  risk: AlertTriangle,
  vendor: Building2,
  control: Shield,
  evidence: FileText,
  framework: BookOpen,
  user: User,
};

export const riskLevelColors: Record<string, string> = {
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

// Phase 6: Deadline status colors
const deadlineStatusColors: Record<DeadlineStatus, string> = {
  overdue: '#dc2626',   // Red
  upcoming: '#f59e0b',  // Amber
  normal: '#6b7280',    // Gray
};

// Phase 6: Evidence freshness colors
const evidenceFreshnessColors: Record<string, string> = {
  fresh: '#4caf50',    // Green - less than 30 days
  stale: '#f59e0b',    // Amber - 30-90 days
  expired: '#dc2626',  // Red - more than 90 days
};

// Phase 6: Vendor tier colors
const vendorTierColors: Record<VendorTier, string> = {
  1: '#dc2626',  // Red - Critical
  2: '#f59e0b',  // Amber - High
  3: '#6b7280',  // Gray - Standard
};

const EntityNode: React.FC<NodeProps> = ({ data, sourcePosition, targetPosition }) => {
  const nodeData = data as unknown as EntityNodeData;
  const IconComponent = entityIcons[nodeData.entityType] || FolderTree;
  const isRiskNode = nodeData.entityType === 'risk';
  const isControlNode = nodeData.entityType === 'control';
  const isVendorNode = nodeData.entityType === 'vendor';
  const riskColor = nodeData.riskLevel ? riskLevelColors[nodeData.riskLevel] : undefined;
  const hasGaps = nodeData.gapResult && nodeData.gapResult.gaps.length > 0;
  const gapBadgeColor = hasGaps ? gapSeverityColors[nodeData.gapResult!.highestSeverity] : undefined;

  // Phase 6: Compliance indicators
  const hasDeadlineWarning = nodeData.deadlineStatus === 'overdue' || nodeData.deadlineStatus === 'upcoming';
  const deadlineColor = nodeData.deadlineStatus ? deadlineStatusColors[nodeData.deadlineStatus] : undefined;
  const hasEvidenceWarning = nodeData.evidenceFreshness === 'stale' || nodeData.evidenceFreshness === 'expired';
  const evidenceColor = nodeData.evidenceFreshness ? evidenceFreshnessColors[nodeData.evidenceFreshness] : undefined;
  const tierColor = nodeData.vendorTier ? vendorTierColors[nodeData.vendorTier] : undefined;

  // Phase 7: Node size based on connections (subtle scaling)
  const connections = nodeData.connectionCount || 0;
  const sizeScale = connections > 10 ? 1.15 : connections > 5 ? 1.08 : connections > 2 ? 1.0 : 0.95;
  const minWidth = Math.round(120 * sizeScale);
  const maxWidth = Math.round(180 * sizeScale);

  // Build tooltip content
  const tooltipContent = (
    <Box>
      {nodeData.sublabel && <p>{nodeData.sublabel}</p>}
      {nodeData.status && <p>Status: {nodeData.status}</p>}
      {nodeData.riskLevel && <p>Risk level: {nodeData.riskLevel}</p>}
      {/* Phase 6: Vendor tier */}
      {isVendorNode && nodeData.vendorTier && (
        <p style={{ color: tierColor }}>Tier {nodeData.vendorTier} vendor</p>
      )}
      {/* Phase 6: Deadline info */}
      {nodeData.reviewDate && (
        <p style={{ color: deadlineColor }}>
          Review: {new Date(nodeData.reviewDate).toLocaleDateString()}
          {nodeData.deadlineStatus === 'overdue' && ' (Overdue)'}
          {nodeData.deadlineStatus === 'upcoming' && nodeData.daysUntilDeadline !== undefined &&
            ` (${nodeData.daysUntilDeadline} days)`}
        </p>
      )}
      {/* Phase 6: Evidence info for controls */}
      {isControlNode && nodeData.evidenceCount !== undefined && (
        <p style={{ color: evidenceColor }}>
          {nodeData.evidenceCount} evidence file{nodeData.evidenceCount !== 1 ? 's' : ''}
          {nodeData.evidenceFreshness === 'stale' && ' (Needs update)'}
          {nodeData.evidenceFreshness === 'expired' && ' (Expired)'}
        </p>
      )}
      {hasGaps && (
        <Box sx={{ mt: 0.5, pt: 0.5, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ fontWeight: 600, color: gapBadgeColor }}>Gaps detected:</p>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {nodeData.gapResult!.gaps.map((gap, idx) => (
              <li key={idx}>{gapRequirementLabels[gap.requirement] || gap.requirement}</li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );

  return (
    <VWTooltip header={nodeData.label} content={tooltipContent} placement="top" maxWidth={300}>
      <Box
        sx={{
          backgroundColor: nodeData.isHighlighted ? '#fffbeb' : 'white',
          border: nodeData.isHighlighted ? '3px solid #f59e0b' : `2px solid ${nodeData.color}`,
          borderRadius: '4px',
          padding: '8px 12px',
          minWidth: minWidth, // Phase 7: Dynamic sizing
          maxWidth: maxWidth, // Phase 7: Dynamic sizing
          boxShadow: nodeData.isHighlighted
            ? '0 0 0 4px rgba(245, 158, 11, 0.3), 0 4px 12px rgba(0,0,0,0.15)'
            : '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          transform: nodeData.isHighlighted ? 'scale(1.05)' : 'scale(1)',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        {/* Gap badge */}
        {hasGaps && (
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: gapBadgeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            <AlertCircle size={10} color="white" />
          </Box>
        )}

        {/* Phase 6: Deadline badge (top-left) */}
        {hasDeadlineWarning && (
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              left: -6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: deadlineColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {nodeData.deadlineStatus === 'overdue' ? (
              <Clock size={10} color="white" />
            ) : (
              <Calendar size={10} color="white" />
            )}
          </Box>
        )}

        {/* Phase 6: Vendor tier badge (bottom-right) */}
        {isVendorNode && nodeData.vendorTier && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              borderRadius: '9px',
              backgroundColor: tierColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              px: 0.5,
            }}
          >
            <Typography sx={{ fontSize: 8, color: 'white', fontWeight: 700, lineHeight: 1 }}>
              T{nodeData.vendorTier}
            </Typography>
          </Box>
        )}

        {/* Phase 6: Annotation indicator (bottom-left) */}
        {nodeData.hasAnnotation && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            <StickyNote size={8} color="white" />
          </Box>
        )}
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

        {/* Phase 6: Evidence count for control nodes */}
        {isControlNode && nodeData.evidenceCount !== undefined && (
          <Box
            sx={{
              mt: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <FileText size={10} color={evidenceColor || '#667085'} />
            <Typography
              variant="caption"
              sx={{
                fontSize: 9,
                color: evidenceColor || '#667085',
                fontWeight: 500,
              }}
            >
              {nodeData.evidenceCount} file{nodeData.evidenceCount !== 1 ? 's' : ''}
              {hasEvidenceWarning && (
                <span style={{ color: evidenceColor, marginLeft: 2 }}>
                  {nodeData.evidenceFreshness === 'expired' ? ' !' : ' •'}
                </span>
              )}
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
    </VWTooltip>
  );
};

export default memo(EntityNode);
