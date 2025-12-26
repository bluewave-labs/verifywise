import type { EntityType } from '../EntityNode';
import type { GapRule, GapTemplate, QueryOption, RelationshipType } from '../types';

// Entity type colors following VerifyWise design system
export const entityColors: Record<EntityType, string> = {
  useCase: '#13715B',     // Primary green
  model: '#2196F3',       // Blue
  risk: '#f44336',        // Red
  vendor: '#9c27b0',      // Purple
  control: '#00bcd4',     // Cyan
  evidence: '#ff9800',    // Orange
  framework: '#607d8b',   // Blue grey
  user: '#795548',        // Brown
};

// Risk level priority for coloring
export const riskPriority: Record<string, number> = {
  'Critical': 4,
  'Very high risk': 4,
  'High': 3,
  'High risk': 3,
  'Medium': 2,
  'Medium risk': 2,
  'Low': 1,
  'Low risk': 1,
  'Very low risk': 0,
};

// Relationship types for edge filtering
export const relationshipTypes: Record<string, RelationshipType> = {
  'used by': { color: '#2196F3', description: 'Model is used by a use case' },
  'supplies': { color: '#9c27b0', description: 'Vendor supplies to a use case' },
  'affects': { color: '#f44336', description: 'Risk affects an entity' },
  'protects': { color: '#00bcd4', description: 'Control protects a use case' },
  'supports': { color: '#ff9800', description: 'Evidence supports a control' },
  'complies with': { color: '#607d8b', description: 'Model complies with framework' },
};

// Smart Query Builder options
export const queryEntityTypes: QueryOption[] = [
  { value: 'models', label: 'all models' },
  { value: 'vendors', label: 'all vendors' },
  { value: 'risks', label: 'all risks' },
  { value: 'controls', label: 'all controls' },
  { value: 'useCases', label: 'all use cases' },
  { value: 'evidence', label: 'all evidence' },
];

export const queryConditions: QueryOption[] = [
  { value: 'with', label: 'with' },
  { value: 'without', label: 'without' },
  { value: 'where', label: 'where' },
];

export const queryAttributes: QueryOption[] = [
  { value: 'risk', label: 'risk assessment', conditions: ['with', 'without'] },
  { value: 'owner', label: 'owner', conditions: ['with', 'without'] },
  { value: 'evidence', label: 'evidence', conditions: ['with', 'without'] },
  { value: 'control', label: 'control', conditions: ['with', 'without'] },
  { value: 'high_severity', label: 'high severity', conditions: ['with', 'where'] },
  { value: 'overdue', label: 'overdue', conditions: ['where'] },
  { value: 'pending_review', label: 'pending review', conditions: ['where'] },
];

// Local storage keys
export const STORAGE_KEY = 'entityGraph_savedViews';
export const LAST_VIEW_KEY = 'entityGraph_lastView';
export const GAP_RULES_KEY = 'entityGraph_gapRules';
export const TOUR_KEY = 'entityGraph_tour';

// Default gap detection rules
export const defaultGapRules: GapRule[] = [
  // Model rules
  { entityType: 'model', requirement: 'has_risk', severity: 'critical', enabled: true },
  { entityType: 'model', requirement: 'has_control', severity: 'critical', enabled: true },
  { entityType: 'model', requirement: 'has_owner', severity: 'warning', enabled: true },
  // Risk rules
  { entityType: 'risk', requirement: 'has_control', severity: 'critical', enabled: true },
  { entityType: 'risk', requirement: 'has_severity', severity: 'warning', enabled: true },
  // Control rules
  { entityType: 'control', requirement: 'has_evidence', severity: 'warning', enabled: true },
  // Vendor rules
  { entityType: 'vendor', requirement: 'has_risk_assessment', severity: 'critical', enabled: true },
  { entityType: 'vendor', requirement: 'has_owner', severity: 'warning', enabled: true },
];

// Gap rule templates
export const gapTemplates: Record<string, GapTemplate> = {
  strict: {
    name: 'Strict (Audit-ready)',
    description: 'All fields required for audit compliance',
    rules: defaultGapRules.map(r => ({ ...r, enabled: true })),
  },
  standard: {
    name: 'Standard',
    description: 'Core fields required',
    rules: defaultGapRules.map(r => ({
      ...r,
      enabled: r.severity !== 'info',
    })),
  },
  minimal: {
    name: 'Minimal',
    description: 'Only critical gaps flagged',
    rules: defaultGapRules.map(r => ({
      ...r,
      enabled: r.severity === 'critical',
    })),
  },
};

// Layout configuration for node positioning
export const layoutConfig = {
  centerX: 600,
  centerY: 400,
  useCaseRadius: 180,
  modelRadius: 350,
  vendorRadius: 350,
  riskRadius: 500,
  controlRadius: 450,
  evidenceRadius: 550,
};

// Default visible entities
export const defaultVisibleEntities = ['useCases', 'models', 'vendors', 'risks', 'controls', 'evidence', 'frameworks'];

// Default visible relationships
export const defaultVisibleRelationships = Object.keys(relationshipTypes);
