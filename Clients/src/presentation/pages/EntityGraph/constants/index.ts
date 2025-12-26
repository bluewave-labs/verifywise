import type { EntityType } from '../EntityNode';

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
