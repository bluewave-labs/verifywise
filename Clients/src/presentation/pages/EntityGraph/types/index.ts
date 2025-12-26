import type { EntityType } from '../EntityNode';

// Extended node data for ReactFlow nodes
export interface ExtendedNodeData {
  label: string;
  sublabel?: string;
  entityType: EntityType;
  color: string;
  status?: string;
  riskLevel?: string;
  riskSource?: 'model' | 'project' | 'vendor';
  rawData?: Record<string, unknown>;
  hasHighRisk?: boolean;
  connectedRiskCount?: number;
  connectionCount?: number;
  isHighlighted?: boolean;
  [key: string]: unknown;
}
