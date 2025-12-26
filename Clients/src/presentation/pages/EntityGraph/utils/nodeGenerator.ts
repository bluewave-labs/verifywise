import type { Node, Edge } from '@xyflow/react';
import { Position, MarkerType } from '@xyflow/react';
import type { EntityGraphData } from '../../../../application/repository/entityGraph.repository';
import type { GapResult, ExtendedNodeData } from '../types';
import { entityColors, riskPriority, layoutConfig } from '../constants';
import { getDeadlineStatus, getEvidenceFreshness, getVendorTier } from './dateHelpers';

/**
 * Options for generating nodes and edges
 */
export interface NodeGeneratorOptions {
  visibleEntities: string[];
  showProblemsOnly: boolean;
  searchQuery: string;
  visibleRelationships: string[];
  activeQuery?: { entityType: string; condition: string; attribute: string };
  gapResults?: Map<string, GapResult>;
  showGapsOnly?: boolean;
}

/**
 * Result from node generation
 */
export interface NodeGeneratorResult {
  nodes: Node[];
  edges: Edge[];
  entityLookup: Map<string, Record<string, unknown>>;
}

/**
 * Check if entity has high risk level
 */
function hasHighRisk(riskLevel?: string): boolean {
  return riskLevel !== undefined && riskPriority[riskLevel] >= 3;
}

/**
 * Filter entity by search query
 */
function matchesSearch(searchQuery: string, label: string, sublabel?: string): boolean {
  if (!searchQuery) return true;
  const query = searchQuery.toLowerCase();
  return label.toLowerCase().includes(query) || (sublabel?.toLowerCase().includes(query) ?? false);
}

/**
 * Apply smart query filter to entity
 */
function matchesQuery(
  entityType: string,
  entity: Record<string, unknown>,
  activeQuery: NodeGeneratorOptions['activeQuery'],
  data: EntityGraphData
): boolean {
  if (!activeQuery?.entityType || !activeQuery?.condition || !activeQuery?.attribute) return true;
  if (activeQuery.entityType !== entityType) return true;

  const { condition, attribute } = activeQuery;

  switch (attribute) {
    case 'risk': {
      const hasRisk = entityType === 'models'
        ? data.risks.some(r => r.model_id === entity.id)
        : entityType === 'vendors'
          ? data.risks.some(r => r.vendor_id === entity.id)
          : entityType === 'useCases'
            ? data.risks.some(r => r.project_id === entity.id)
            : false;
      return condition === 'with' ? hasRisk : !hasRisk;
    }
    case 'owner': {
      const hasOwner = Boolean(entity.owner);
      return condition === 'with' ? hasOwner : !hasOwner;
    }
    case 'evidence': {
      const hasEvidence = entityType === 'controls'
        ? data.evidence.some(e => e.control_id === entity.id)
        : false;
      return condition === 'with' ? hasEvidence : !hasEvidence;
    }
    case 'control': {
      const hasControl = entityType === 'useCases'
        ? data.controls.some(c => c.project_id === entity.id)
        : false;
      return condition === 'with' ? hasControl : !hasControl;
    }
    case 'high_severity': {
      const isHighSeverity = entityType === 'risks'
        ? riskPriority[entity.risk_level as string] >= 3
        : entityType === 'models'
          ? data.risks.some(r => r.model_id === entity.id && riskPriority[r.risk_level] >= 3)
          : entityType === 'vendors'
            ? data.risks.some(r => r.vendor_id === entity.id && riskPriority[r.risk_level] >= 3)
            : false;
      return isHighSeverity;
    }
    case 'overdue': {
      const targetDate = entity.target_date || entity.review_date;
      if (!targetDate) return false;
      return new Date(targetDate as string) < new Date();
    }
    case 'pending_review': {
      const status = (entity.status || entity.review_status) as string;
      return status?.toLowerCase().includes('pending') || status?.toLowerCase().includes('review');
    }
    default:
      return true;
  }
}

/**
 * Calculate connection counts for node sizing
 */
function calculateConnectionCounts(data: EntityGraphData): Map<string, number> {
  const connectionCounts = new Map<string, number>();
  const countConnection = (nodeId: string) => {
    connectionCounts.set(nodeId, (connectionCounts.get(nodeId) || 0) + 1);
  };

  // Filter non-organizational use cases
  const regularUseCases = data.useCases.filter(p => !(p as { is_organizational?: boolean }).is_organizational);

  // Count connections for use cases
  regularUseCases.forEach(uc => {
    const ucId = `useCase-${uc.id}`;
    data.models.forEach(m => {
      if (m.projects?.includes(uc.id)) countConnection(ucId);
    });
    data.controls.forEach(c => {
      if (c.project_id === uc.id) countConnection(ucId);
    });
    data.risks.forEach(r => {
      if (r.project_id === uc.id) countConnection(ucId);
    });
  });

  // Count connections for models
  data.models.forEach(m => {
    const mId = `model-${m.id}`;
    if (m.projects?.length) connectionCounts.set(mId, (connectionCounts.get(mId) || 0) + m.projects.length);
    data.risks.filter(r => r.model_id === m.id).forEach(() => countConnection(mId));
  });

  // Count connections for vendors
  data.vendors.forEach(v => {
    const vId = `vendor-${v.id}`;
    if (v.projects?.length) connectionCounts.set(vId, (connectionCounts.get(vId) || 0) + v.projects.length);
    data.risks.filter(r => r.vendor_id === v.id).forEach(() => countConnection(vId));
  });

  // Count connections for controls
  data.controls.forEach(c => {
    const cId = `control-${c.id}`;
    if (c.project_id) countConnection(cId);
    data.evidence.filter(e => e.control_id === c.id).forEach(() => countConnection(cId));
  });

  // Count connections for evidence
  data.evidence.forEach(e => {
    const eId = `evidence-${e.id}`;
    if (e.control_id) countConnection(eId);
  });

  return connectionCounts;
}

/**
 * Generate nodes and edges from entity data
 */
export function generateNodesAndEdges(
  data: EntityGraphData,
  options: NodeGeneratorOptions
): NodeGeneratorResult {
  const {
    visibleEntities,
    showProblemsOnly,
    searchQuery,
    visibleRelationships,
    activeQuery,
    gapResults,
    showGapsOnly
  } = options;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const entityLookup = new Map<string, Record<string, unknown>>();
  const createdNodeIds = new Set<string>();

  // Create user map for resolving IDs to names
  const userMap = new Map<number, string>();
  data.users?.forEach(user => {
    userMap.set(user.id, `${user.name} ${user.surname}`.trim());
  });
  const getUserName = (userId: number | undefined): string | undefined => {
    if (userId === undefined || userId === null) return undefined;
    return userMap.get(userId);
  };

  // Pre-calculate connection counts
  const connectionCounts = calculateConnectionCounts(data);

  // Layout constants
  const { centerX, centerY, useCaseRadius, modelRadius, vendorRadius, riskRadius, controlRadius, evidenceRadius } = layoutConfig;

  // Filter non-organizational use cases
  const regularUseCases = data.useCases.filter(p => !(p as { is_organizational?: boolean }).is_organizational);

  // Helper to check if edge should be visible
  const shouldShowEdge = (label: string) => visibleRelationships.includes(label);

  // Add Use Case nodes
  if (visibleEntities.includes('useCases')) {
    regularUseCases.forEach((useCase, index) => {
      const useCaseHasHighRisk = data.risks.some(
        r => r.project_id === useCase.id && hasHighRisk(r.risk_level)
      );
      const nodeId = `useCase-${useCase.id}`;
      const gapResult = gapResults?.get(nodeId);

      if (showProblemsOnly && !useCaseHasHighRisk) return;
      if (showGapsOnly && !gapResult) return;
      if (!matchesSearch(searchQuery, useCase.uc_id || useCase.project_title, useCase.project_title)) return;
      if (!matchesQuery('useCases', useCase as unknown as Record<string, unknown>, activeQuery, data)) return;

      const angle = (2 * Math.PI * index) / Math.max(regularUseCases.length, 1);
      entityLookup.set(nodeId, useCase as unknown as Record<string, unknown>);

      const useCaseReviewDate = useCase.review_date;
      const deadlineInfo = getDeadlineStatus(useCaseReviewDate);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + useCaseRadius * Math.cos(angle),
          y: centerY + useCaseRadius * Math.sin(angle),
        },
        data: {
          label: useCase.uc_id || useCase.project_title,
          sublabel: useCase.project_title,
          entityType: 'useCase',
          color: useCaseHasHighRisk ? entityColors.risk : entityColors.useCase,
          hasHighRisk: useCaseHasHighRisk,
          rawData: { ...useCase, owner_name: getUserName(useCase.owner) },
          gapResult,
          reviewDate: useCaseReviewDate,
          deadlineStatus: deadlineInfo?.status,
          daysUntilDeadline: deadlineInfo?.daysUntil,
          connectionCount: connectionCounts.get(nodeId) || 0,
        } as ExtendedNodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: false,
      });
      createdNodeIds.add(nodeId);
    });
  }

  // Add Model nodes
  if (visibleEntities.includes('models')) {
    data.models.forEach((model, index) => {
      const modelHasHighRisk = data.risks.some(
        r => r.model_id === model.id && hasHighRisk(r.risk_level)
      );
      const nodeId = `model-${model.id}`;
      const gapResult = gapResults?.get(nodeId);

      if (showProblemsOnly && !modelHasHighRisk) return;
      if (showGapsOnly && !gapResult) return;
      if (!matchesSearch(searchQuery, model.model, model.provider)) return;
      if (!matchesQuery('models', model as unknown as Record<string, unknown>, activeQuery, data)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.models.length, 1) - Math.PI / 4;
      entityLookup.set(nodeId, model as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + modelRadius * Math.cos(angle) - 250,
          y: centerY + modelRadius * Math.sin(angle),
        },
        data: {
          label: model.model,
          sublabel: model.provider,
          entityType: 'model',
          color: modelHasHighRisk ? entityColors.risk : entityColors.model,
          status: model.status,
          hasHighRisk: modelHasHighRisk,
          rawData: { ...model, owner_name: getUserName(model.owner) },
          gapResult,
          connectionCount: connectionCounts.get(nodeId) || 0,
        } as ExtendedNodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: false,
      });
      createdNodeIds.add(nodeId);

      // Connect models to use cases
      if (visibleEntities.includes('useCases') && model.projects?.length && shouldShowEdge('used by')) {
        model.projects.forEach((projectId) => {
          const targetId = `useCase-${projectId}`;
          if (createdNodeIds.has(targetId)) {
            edges.push({
              id: `model-${model.id}-useCase-${projectId}`,
              source: `model-${model.id}`,
              target: targetId,
              type: 'smoothstep',
              animated: false,
              label: 'used by',
              labelStyle: { fontSize: 9, fill: '#667085' },
              labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
              style: { stroke: entityColors.model, strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: entityColors.model, width: 15, height: 15 },
            });
          }
        });
      }
    });
  }

  // Add Vendor nodes
  if (visibleEntities.includes('vendors')) {
    data.vendors.forEach((vendor, index) => {
      const vendorHasHighRisk = data.risks.some(
        r => r.vendor_id === vendor.id && hasHighRisk(r.risk_level)
      );
      const nodeId = `vendor-${vendor.id}`;
      const gapResult = gapResults?.get(nodeId);

      if (showProblemsOnly && !vendorHasHighRisk) return;
      if (showGapsOnly && !gapResult) return;
      if (!matchesSearch(searchQuery, vendor.vendor_name)) return;
      if (!matchesQuery('vendors', vendor as unknown as Record<string, unknown>, activeQuery, data)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.vendors.length, 1) + Math.PI / 4;
      entityLookup.set(nodeId, vendor as unknown as Record<string, unknown>);

      const vendorReviewDate = (vendor as { review_date?: string }).review_date;
      const deadlineInfo = getDeadlineStatus(vendorReviewDate);
      const vendorTier = getVendorTier(vendor);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + vendorRadius * Math.cos(angle) + 250,
          y: centerY + vendorRadius * Math.sin(angle),
        },
        data: {
          label: vendor.vendor_name,
          entityType: 'vendor',
          color: vendorHasHighRisk ? entityColors.risk : entityColors.vendor,
          status: vendor.review_status,
          hasHighRisk: vendorHasHighRisk,
          rawData: {
            ...vendor,
            owner_name: getUserName(vendor.owner),
            assignee_name: getUserName(vendor.assignee),
            reviewer_name: getUserName(vendor.reviewer),
          },
          gapResult,
          vendorTier,
          reviewDate: vendorReviewDate,
          deadlineStatus: deadlineInfo?.status,
          daysUntilDeadline: deadlineInfo?.daysUntil,
          connectionCount: connectionCounts.get(nodeId) || 0,
        } as ExtendedNodeData,
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
        draggable: false,
      });
      createdNodeIds.add(nodeId);

      // Connect vendors to use cases
      if (visibleEntities.includes('useCases') && vendor.projects?.length && shouldShowEdge('supplies')) {
        vendor.projects.forEach((projectId) => {
          const targetId = `useCase-${projectId}`;
          if (createdNodeIds.has(targetId)) {
            edges.push({
              id: `vendor-${vendor.id}-useCase-${projectId}`,
              source: `vendor-${vendor.id}`,
              target: targetId,
              type: 'smoothstep',
              animated: false,
              label: 'supplies',
              labelStyle: { fontSize: 9, fill: '#667085' },
              labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
              style: { stroke: entityColors.vendor, strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: entityColors.vendor, width: 15, height: 15 },
            });
          }
        });
      }
    });
  }

  // Add Risk nodes
  if (visibleEntities.includes('risks')) {
    data.risks.forEach((risk, index) => {
      const isHighRisk = hasHighRisk(risk.risk_level);
      const nodeId = `risk-${risk.id}`;
      const gapResult = gapResults?.get(nodeId);

      if (showProblemsOnly && !isHighRisk) return;
      if (showGapsOnly && !gapResult) return;
      if (!matchesSearch(searchQuery, risk.risk_name)) return;
      if (!matchesQuery('risks', risk as unknown as Record<string, unknown>, activeQuery, data)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.risks.length, 1);
      entityLookup.set(nodeId, risk as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + riskRadius * Math.cos(angle),
          y: centerY + riskRadius * Math.sin(angle),
        },
        data: {
          label: risk.risk_name.substring(0, 30) + (risk.risk_name.length > 30 ? '...' : ''),
          entityType: 'risk',
          color: entityColors.risk,
          riskLevel: risk.risk_level,
          riskSource: risk.source,
          hasHighRisk: isHighRisk,
          rawData: { ...risk, action_owner_name: getUserName(risk.action_owner) },
          gapResult,
          connectionCount: connectionCounts.get(nodeId) || 0,
        } as ExtendedNodeData,
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
        draggable: false,
      });
      createdNodeIds.add(nodeId);

      // Connect risks to their source entities
      if (shouldShowEdge('affects')) {
        if (risk.model_id && visibleEntities.includes('models')) {
          const targetId = `model-${risk.model_id}`;
          if (createdNodeIds.has(targetId)) {
            edges.push({
              id: `risk-${risk.id}-model-${risk.model_id}`,
              source: `risk-${risk.id}`,
              target: targetId,
              type: 'smoothstep',
              label: 'affects',
              labelStyle: { fontSize: 9, fill: '#667085' },
              labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
              style: { stroke: entityColors.risk, strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: entityColors.risk, width: 15, height: 15 },
            });
          }
        }
        if (risk.project_id && visibleEntities.includes('useCases')) {
          const targetId = `useCase-${risk.project_id}`;
          if (createdNodeIds.has(targetId)) {
            edges.push({
              id: `risk-${risk.id}-useCase-${risk.project_id}`,
              source: `risk-${risk.id}`,
              target: targetId,
              type: 'smoothstep',
              label: 'affects',
              labelStyle: { fontSize: 9, fill: '#667085' },
              labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
              style: { stroke: entityColors.risk, strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: entityColors.risk, width: 15, height: 15 },
            });
          }
        }
        if (risk.vendor_id && visibleEntities.includes('vendors')) {
          const targetId = `vendor-${risk.vendor_id}`;
          if (createdNodeIds.has(targetId)) {
            edges.push({
              id: `risk-${risk.id}-vendor-${risk.vendor_id}`,
              source: `risk-${risk.id}`,
              target: targetId,
              type: 'smoothstep',
              label: 'affects',
              labelStyle: { fontSize: 9, fill: '#667085' },
              labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
              style: { stroke: entityColors.risk, strokeWidth: 1.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color: entityColors.risk, width: 15, height: 15 },
            });
          }
        }
      }
    });
  }

  // Add Control nodes
  if (visibleEntities.includes('controls')) {
    data.controls.forEach((control, index) => {
      const nodeId = `control-${control.id}`;
      const gapResult = gapResults?.get(nodeId);

      if (!matchesSearch(searchQuery, control.title)) return;
      if (showProblemsOnly && !gapResult) return;
      if (showGapsOnly && !gapResult) return;
      if (!matchesQuery('controls', control as unknown as Record<string, unknown>, activeQuery, data)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.controls.length, 1) + Math.PI / 6;
      entityLookup.set(nodeId, control as unknown as Record<string, unknown>);

      // Calculate evidence count and freshness
      const controlEvidence = data.evidence.filter(e => e.control_id === control.id);
      const evidenceCount = controlEvidence.length;
      const lastEvidence = controlEvidence.reduce((latest, e) => {
        const eDate = e.uploaded_at || e.created_at;
        const latestDate = latest?.uploaded_at || latest?.created_at;
        if (!eDate) return latest;
        if (!latestDate) return e;
        return new Date(eDate) > new Date(latestDate) ? e : latest;
      }, controlEvidence[0] as typeof controlEvidence[0] | undefined);
      const lastEvidenceDate = lastEvidence?.uploaded_at || lastEvidence?.created_at;
      const evidenceFreshness = getEvidenceFreshness(lastEvidenceDate);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + controlRadius * Math.cos(angle) - 150,
          y: centerY + controlRadius * Math.sin(angle) + 100,
        },
        data: {
          label: control.title.substring(0, 30) + (control.title.length > 30 ? '...' : ''),
          entityType: 'control',
          color: entityColors.control,
          status: control.status,
          rawData: {
            ...control,
            owner_name: getUserName(control.owner),
            approver_name: getUserName(control.approver),
            reviewer_name: getUserName(control.reviewer),
          },
          gapResult,
          evidenceCount,
          evidenceFreshness: evidenceFreshness || undefined,
          lastEvidenceDate,
          connectionCount: connectionCounts.get(nodeId) || 0,
        } as ExtendedNodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: false,
      });
      createdNodeIds.add(nodeId);

      // Connect controls to use cases
      if (control.project_id && visibleEntities.includes('useCases') && shouldShowEdge('protects')) {
        const targetId = `useCase-${control.project_id}`;
        if (createdNodeIds.has(targetId)) {
          edges.push({
            id: `control-${control.id}-useCase-${control.project_id}`,
            source: `control-${control.id}`,
            target: targetId,
            type: 'smoothstep',
            label: 'protects',
            labelStyle: { fontSize: 9, fill: '#667085' },
            labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
            style: { stroke: entityColors.control, strokeWidth: 1.5, strokeDasharray: '5,5' },
            markerEnd: { type: MarkerType.ArrowClosed, color: entityColors.control, width: 15, height: 15 },
          });
        }
      }
    });
  }

  // Add Evidence nodes
  if (visibleEntities.includes('evidence')) {
    data.evidence.forEach((ev, index) => {
      const evName = ev.name || 'Untitled Evidence';
      const nodeId = `evidence-${ev.id}`;
      const gapResult = gapResults?.get(nodeId);

      if (!matchesSearch(searchQuery, evName)) return;
      if (showProblemsOnly) return;
      if (showGapsOnly && !gapResult) return;
      if (!matchesQuery('evidence', ev as unknown as Record<string, unknown>, activeQuery, data)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.evidence.length, 1) + Math.PI / 3;
      entityLookup.set(nodeId, ev as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + evidenceRadius * Math.cos(angle) + 150,
          y: centerY + evidenceRadius * Math.sin(angle) + 100,
        },
        data: {
          label: evName.substring(0, 25) + (evName.length > 25 ? '...' : ''),
          entityType: 'evidence',
          color: entityColors.evidence,
          rawData: { ...ev },
          gapResult,
          connectionCount: connectionCounts.get(nodeId) || 0,
        } as ExtendedNodeData,
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
        draggable: false,
      });
      createdNodeIds.add(nodeId);

      // Connect evidence to controls
      if (ev.control_id && visibleEntities.includes('controls') && shouldShowEdge('supports')) {
        const targetId = `control-${ev.control_id}`;
        if (createdNodeIds.has(targetId)) {
          edges.push({
            id: `evidence-${ev.id}-control-${ev.control_id}`,
            source: `evidence-${ev.id}`,
            target: targetId,
            type: 'smoothstep',
            label: 'supports',
            labelStyle: { fontSize: 9, fill: '#667085' },
            labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
            style: { stroke: entityColors.evidence, strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: entityColors.evidence, width: 15, height: 15 },
          });
        }
      }
    });
  }

  // Add Framework nodes
  if (visibleEntities.includes('frameworks')) {
    data.frameworks.forEach((framework, index) => {
      if (!matchesSearch(searchQuery, framework.name)) return;
      if (showProblemsOnly) return;
      if (!matchesQuery('frameworks', framework as unknown as Record<string, unknown>, activeQuery, data)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.frameworks.length, 1) + Math.PI / 2;
      const nodeId = `framework-${framework.id}`;
      entityLookup.set(nodeId, framework as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + modelRadius * Math.cos(angle) - 400,
          y: centerY + 150 + modelRadius * Math.sin(angle),
        },
        data: {
          label: framework.name,
          entityType: 'framework',
          color: entityColors.framework,
          rawData: framework,
          connectionCount: connectionCounts.get(nodeId) || 0,
        } as ExtendedNodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: false,
      });
      createdNodeIds.add(nodeId);
    });

    // Connect models to frameworks
    if (visibleEntities.includes('models') && shouldShowEdge('complies with')) {
      data.models.forEach((model) => {
        const sourceId = `model-${model.id}`;
        if (!createdNodeIds.has(sourceId)) return;

        if (model.frameworks?.length) {
          model.frameworks.forEach((frameworkId) => {
            const targetId = `framework-${frameworkId}`;
            if (createdNodeIds.has(targetId)) {
              edges.push({
                id: `model-${model.id}-framework-${frameworkId}`,
                source: sourceId,
                target: targetId,
                type: 'smoothstep',
                label: 'complies with',
                labelStyle: { fontSize: 9, fill: '#667085' },
                labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
                style: { stroke: entityColors.framework, strokeWidth: 1, strokeDasharray: '5,5' },
              });
            }
          });
        }
      });
    }
  }

  return { nodes, edges, entityLookup };
}

/**
 * Get connected entities for sidebar display
 */
export function getConnectedEntities(
  nodeId: string,
  edges: Edge[],
  entityLookup: Map<string, Record<string, unknown>>
): Array<{ type: string; count: number; items: Array<{ id: string; label: string }> }> {
  const connected: Map<string, { id: string; label: string }[]> = new Map();

  edges.forEach(edge => {
    let connectedNodeId: string | null = null;
    if (edge.source === nodeId) {
      connectedNodeId = edge.target;
    } else if (edge.target === nodeId) {
      connectedNodeId = edge.source;
    }

    if (connectedNodeId) {
      const [type] = connectedNodeId.split('-');
      const entity = entityLookup.get(connectedNodeId);
      if (entity) {
        const items = connected.get(type) || [];
        const label = (entity as { project_title?: string }).project_title
          || (entity as { model?: string }).model
          || (entity as { vendor_name?: string }).vendor_name
          || (entity as { risk_name?: string }).risk_name
          || (entity as { title?: string }).title
          || (entity as { name?: string }).name
          || 'Unknown';
        items.push({ id: connectedNodeId, label });
        connected.set(type, items);
      }
    }
  });

  return Array.from(connected.entries()).map(([type, items]) => ({
    type,
    count: items.length,
    items,
  }));
}
