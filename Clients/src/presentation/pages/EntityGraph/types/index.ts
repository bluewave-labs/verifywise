import type { EntityType } from '../EntityNode';

// Saved View interface for persisting user configurations
export interface SavedView {
  id: string;
  name: string;
  visibleEntities: string[];
  visibleRelationships: string[];
  showProblemsOnly: boolean;
  query?: {
    entityType: string;
    condition: string;
    attribute: string;
  };
  createdAt: number;
}

// Gap detection types
export type GapSeverity = 'critical' | 'warning' | 'info';
export type EntityTypeForGap = 'model' | 'risk' | 'control' | 'vendor' | 'useCase';

export interface GapRule {
  entityType: EntityTypeForGap;
  requirement: string;
  severity: GapSeverity;
  enabled: boolean;
}

export interface GapResult {
  entityId: string;
  entityType: EntityTypeForGap;
  gaps: Array<{
    requirement: string;
    severity: GapSeverity;
    daysSinceCreation?: number;
  }>;
  highestSeverity: GapSeverity;
}

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
  gapResult?: GapResult;
  // Compliance features
  deadlineStatus?: 'overdue' | 'upcoming' | 'normal';
  daysUntilDeadline?: number;
  reviewDate?: string;
  evidenceCount?: number;
  evidenceFreshness?: 'fresh' | 'stale' | 'expired';
  lastEvidenceDate?: string;
  vendorTier?: 1 | 2 | 3;
  connectionCount?: number;
  [key: string]: unknown;
}

// Context menu state - used in index.tsx and hooks
export interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  nodeId: string;
  nodeData: ExtendedNodeData;
}

// Impacted node for impact analysis
export interface ImpactedNode {
  id: string;
  entityType: EntityType;
  label: string;
  depth: number;
  impactType: 'direct' | 'indirect';
  riskLevel?: string;
}

// Smart query builder types
export interface QueryOption {
  value: string;
  label: string;
  conditions?: string[];
}

// Relationship type definition
export interface RelationshipType {
  color: string;
  description: string;
}

// Gap template definition
export interface GapTemplate {
  name: string;
  description: string;
  rules: GapRule[];
}
