// Barrel export for Entity Graph utilities
export { detectGaps } from './gapDetector';
export {
  findShortestPath,
  getNodesWithinDepth,
  getCompliancePath,
  impactDepthColors,
  getImpactColor,
  type ImpactedNodeResult
} from './pathFinder';
export {
  getDeadlineStatus,
  getEvidenceFreshness,
  getVendorTier,
  getDaysSinceCreation
} from './dateHelpers';
export {
  generateNodesAndEdges,
  getConnectedEntities,
  type NodeGeneratorOptions,
  type NodeGeneratorResult
} from './nodeGenerator';
