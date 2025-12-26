import type { Node, Edge } from '@xyflow/react';
import { Position, MarkerType } from '@xyflow/react';
import type { EntityGraphData } from '../../../../application/repository/entityGraph.repository';
import type { ExtendedNodeData } from '../types';
import { entityColors, riskPriority, layoutConfig } from '../constants';

export interface NodeGeneratorOptions {
  visibleEntities: string[];
  showProblemsOnly: boolean;
  searchQuery: string;
  visibleRelationships: string[];
}

export interface NodeGeneratorResult {
  nodes: Node[];
  edges: Edge[];
  entityLookup: Map<string, Record<string, unknown>>;
}

/** Check if entity has high risk level */
function hasHighRisk(riskLevel?: string): boolean {
  return riskLevel !== undefined && riskPriority[riskLevel] >= 3;
}

/** Filter entity by search query */
function matchesSearch(searchQuery: string, label: string, sublabel?: string): boolean {
  if (!searchQuery) return true;
  const query = searchQuery.toLowerCase();
  return label.toLowerCase().includes(query) || (sublabel?.toLowerCase().includes(query) ?? false);
}

/** Create an edge with standard styling */
function createEdge(
  id: string,
  source: string,
  target: string,
  label: string,
  color: string,
  options?: { dashed?: boolean; animated?: boolean }
): Edge {
  return {
    id,
    source,
    target,
    type: 'smoothstep',
    animated: options?.animated ?? false,
    label,
    labelStyle: { fontSize: 9, fill: '#667085' },
    labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
    style: {
      stroke: color,
      strokeWidth: 1.5,
      ...(options?.dashed && { strokeDasharray: '5,5' }),
    },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
  };
}

/** Calculate connection counts for node sizing */
function calculateConnectionCounts(data: EntityGraphData): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (id: string) => counts.set(id, (counts.get(id) || 0) + 1);

  const regularUseCases = data.useCases.filter(p => !(p as { is_organizational?: boolean }).is_organizational);

  regularUseCases.forEach(uc => {
    const ucId = `useCase-${uc.id}`;
    data.models.forEach(m => { if (m.projects?.includes(uc.id)) add(ucId); });
    data.controls.forEach(c => { if (c.project_id === uc.id) add(ucId); });
    data.risks.forEach(r => { if (r.project_id === uc.id) add(ucId); });
  });

  data.models.forEach(m => {
    const id = `model-${m.id}`;
    if (m.projects?.length) counts.set(id, (counts.get(id) || 0) + m.projects.length);
    data.risks.filter(r => r.model_id === m.id).forEach(() => add(id));
  });

  data.vendors.forEach(v => {
    const id = `vendor-${v.id}`;
    if (v.projects?.length) counts.set(id, (counts.get(id) || 0) + v.projects.length);
    data.risks.filter(r => r.vendor_id === v.id).forEach(() => add(id));
  });

  data.controls.forEach(c => {
    const id = `control-${c.id}`;
    if (c.project_id) add(id);
    data.evidence.filter(e => e.control_id === c.id).forEach(() => add(id));
  });

  data.evidence.forEach(e => { if (e.control_id) add(`evidence-${e.id}`); });

  return counts;
}

/** Generate nodes and edges from entity data */
export function generateNodesAndEdges(
  data: EntityGraphData,
  options: NodeGeneratorOptions
): NodeGeneratorResult {
  const { visibleEntities, showProblemsOnly, searchQuery, visibleRelationships } = options;
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const entityLookup = new Map<string, Record<string, unknown>>();
  const createdNodeIds = new Set<string>();

  // User map for resolving IDs to names
  const userMap = new Map<number, string>();
  data.users?.forEach(u => userMap.set(u.id, `${u.name} ${u.surname}`.trim()));
  const getUserName = (id?: number) => id ? userMap.get(id) : undefined;

  const connectionCounts = calculateConnectionCounts(data);
  const { centerX, centerY, useCaseRadius, modelRadius, vendorRadius, riskRadius, controlRadius, evidenceRadius } = layoutConfig;
  const regularUseCases = data.useCases.filter(p => !(p as { is_organizational?: boolean }).is_organizational);
  const shouldShowEdge = (label: string) => visibleRelationships.length === 0 || visibleRelationships.includes(label);

  // Helper to create a node
  const addNode = (
    id: string,
    entityType: ExtendedNodeData['entityType'],
    position: { x: number; y: number },
    label: string,
    color: string,
    extraData: Partial<ExtendedNodeData>
  ) => {
    nodes.push({
      id,
      type: 'entity',
      position,
      data: { label, entityType, color, connectionCount: connectionCounts.get(id) || 0, ...extraData } as ExtendedNodeData,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: false,
    });
    createdNodeIds.add(id);
  };

  // USE CASES
  if (visibleEntities.includes('useCases')) {
    regularUseCases.forEach((uc, i) => {
      const hasRisk = data.risks.some(r => r.project_id === uc.id && hasHighRisk(r.risk_level));
      if (showProblemsOnly && !hasRisk) return;
      if (!matchesSearch(searchQuery, uc.uc_id || uc.project_title, uc.project_title)) return;

      const angle = (2 * Math.PI * i) / Math.max(regularUseCases.length, 1);
      const id = `useCase-${uc.id}`;
      entityLookup.set(id, uc as unknown as Record<string, unknown>);
      addNode(id, 'useCase',
        { x: centerX + useCaseRadius * Math.cos(angle), y: centerY + useCaseRadius * Math.sin(angle) },
        uc.uc_id || uc.project_title,
        hasRisk ? entityColors.risk : entityColors.useCase,
        { sublabel: uc.project_title, hasHighRisk: hasRisk, rawData: { ...uc, owner_name: getUserName(uc.owner) } }
      );
    });
  }

  // MODELS
  if (visibleEntities.includes('models')) {
    data.models.forEach((m, i) => {
      const hasRisk = data.risks.some(r => r.model_id === m.id && hasHighRisk(r.risk_level));
      if (showProblemsOnly && !hasRisk) return;
      if (!matchesSearch(searchQuery, m.model, m.provider)) return;

      const angle = (2 * Math.PI * i) / Math.max(data.models.length, 1) - Math.PI / 4;
      const id = `model-${m.id}`;
      entityLookup.set(id, m as unknown as Record<string, unknown>);
      addNode(id, 'model',
        { x: centerX + modelRadius * Math.cos(angle) - 250, y: centerY + modelRadius * Math.sin(angle) },
        m.model,
        hasRisk ? entityColors.risk : entityColors.model,
        { sublabel: m.provider, status: m.status, hasHighRisk: hasRisk, rawData: { ...m, owner_name: getUserName(m.owner) } }
      );

      // Model → UseCase edges
      if (visibleEntities.includes('useCases') && m.projects?.length && shouldShowEdge('used by')) {
        m.projects.forEach(pid => {
          const targetId = `useCase-${pid}`;
          if (createdNodeIds.has(targetId)) {
            edges.push(createEdge(`model-${m.id}-useCase-${pid}`, id, targetId, 'used by', entityColors.model));
          }
        });
      }
    });
  }

  // VENDORS
  if (visibleEntities.includes('vendors')) {
    data.vendors.forEach((v, i) => {
      const hasRisk = data.risks.some(r => r.vendor_id === v.id && hasHighRisk(r.risk_level));
      if (showProblemsOnly && !hasRisk) return;
      if (!matchesSearch(searchQuery, v.vendor_name)) return;

      const angle = (2 * Math.PI * i) / Math.max(data.vendors.length, 1) + Math.PI / 4;
      const id = `vendor-${v.id}`;
      entityLookup.set(id, v as unknown as Record<string, unknown>);
      addNode(id, 'vendor',
        { x: centerX + vendorRadius * Math.cos(angle) + 250, y: centerY + vendorRadius * Math.sin(angle) },
        v.vendor_name,
        hasRisk ? entityColors.risk : entityColors.vendor,
        { status: v.review_status, hasHighRisk: hasRisk, rawData: { ...v, owner_name: getUserName(v.owner), assignee_name: getUserName(v.assignee), reviewer_name: getUserName(v.reviewer) } }
      );

      // Vendor → UseCase edges
      if (visibleEntities.includes('useCases') && v.projects?.length && shouldShowEdge('supplies')) {
        v.projects.forEach(pid => {
          const targetId = `useCase-${pid}`;
          if (createdNodeIds.has(targetId)) {
            edges.push(createEdge(`vendor-${v.id}-useCase-${pid}`, id, targetId, 'supplies', entityColors.vendor));
          }
        });
      }
    });
  }

  // RISKS
  if (visibleEntities.includes('risks')) {
    data.risks.forEach((r, i) => {
      const isHigh = hasHighRisk(r.risk_level);
      if (showProblemsOnly && !isHigh) return;
      if (!matchesSearch(searchQuery, r.risk_name)) return;

      const angle = (2 * Math.PI * i) / Math.max(data.risks.length, 1);
      const id = `risk-${r.id}`;
      entityLookup.set(id, r as unknown as Record<string, unknown>);
      addNode(id, 'risk',
        { x: centerX + riskRadius * Math.cos(angle), y: centerY + riskRadius * Math.sin(angle) },
        r.risk_name.substring(0, 30) + (r.risk_name.length > 30 ? '...' : ''),
        entityColors.risk,
        { riskLevel: r.risk_level, riskSource: r.source, hasHighRisk: isHigh, rawData: { ...r, action_owner_name: getUserName(r.action_owner) } }
      );

      // Risk → Source edges
      if (shouldShowEdge('affects')) {
        if (r.model_id && visibleEntities.includes('models') && createdNodeIds.has(`model-${r.model_id}`)) {
          edges.push(createEdge(`risk-${r.id}-model-${r.model_id}`, id, `model-${r.model_id}`, 'affects', entityColors.risk));
        }
        if (r.project_id && visibleEntities.includes('useCases') && createdNodeIds.has(`useCase-${r.project_id}`)) {
          edges.push(createEdge(`risk-${r.id}-useCase-${r.project_id}`, id, `useCase-${r.project_id}`, 'affects', entityColors.risk));
        }
        if (r.vendor_id && visibleEntities.includes('vendors') && createdNodeIds.has(`vendor-${r.vendor_id}`)) {
          edges.push(createEdge(`risk-${r.id}-vendor-${r.vendor_id}`, id, `vendor-${r.vendor_id}`, 'affects', entityColors.risk));
        }
      }
    });
  }

  // CONTROLS
  if (visibleEntities.includes('controls')) {
    data.controls.forEach((c, i) => {
      if (showProblemsOnly) return;
      if (!matchesSearch(searchQuery, c.title)) return;

      const angle = (2 * Math.PI * i) / Math.max(data.controls.length, 1) + Math.PI / 6;
      const id = `control-${c.id}`;
      const evidenceCount = data.evidence.filter(e => e.control_id === c.id).length;
      entityLookup.set(id, c as unknown as Record<string, unknown>);
      addNode(id, 'control',
        { x: centerX + controlRadius * Math.cos(angle) - 150, y: centerY + controlRadius * Math.sin(angle) + 100 },
        c.title.substring(0, 30) + (c.title.length > 30 ? '...' : ''),
        entityColors.control,
        { status: c.status, evidenceCount, rawData: { ...c, owner_name: getUserName(c.owner), approver_name: getUserName(c.approver), reviewer_name: getUserName(c.reviewer) } }
      );

      // Control → UseCase edges
      if (c.project_id && visibleEntities.includes('useCases') && shouldShowEdge('protects') && createdNodeIds.has(`useCase-${c.project_id}`)) {
        edges.push(createEdge(`control-${c.id}-useCase-${c.project_id}`, id, `useCase-${c.project_id}`, 'protects', entityColors.control, { dashed: true }));
      }
    });
  }

  // EVIDENCE
  if (visibleEntities.includes('evidence')) {
    data.evidence.forEach((e, i) => {
      if (showProblemsOnly) return;
      const name = e.name || 'Untitled Evidence';
      if (!matchesSearch(searchQuery, name)) return;

      const angle = (2 * Math.PI * i) / Math.max(data.evidence.length, 1) + Math.PI / 3;
      const id = `evidence-${e.id}`;
      entityLookup.set(id, e as unknown as Record<string, unknown>);
      addNode(id, 'evidence',
        { x: centerX + evidenceRadius * Math.cos(angle) + 150, y: centerY + evidenceRadius * Math.sin(angle) + 100 },
        name.substring(0, 25) + (name.length > 25 ? '...' : ''),
        entityColors.evidence,
        { rawData: { ...e } }
      );

      // Evidence → Control edges
      if (e.control_id && visibleEntities.includes('controls') && shouldShowEdge('supports') && createdNodeIds.has(`control-${e.control_id}`)) {
        edges.push(createEdge(`evidence-${e.id}-control-${e.control_id}`, id, `control-${e.control_id}`, 'supports', entityColors.evidence));
      }
    });
  }

  // FRAMEWORKS
  if (visibleEntities.includes('frameworks')) {
    data.frameworks.forEach((f, i) => {
      if (showProblemsOnly) return;
      if (!matchesSearch(searchQuery, f.name)) return;

      const angle = (2 * Math.PI * i) / Math.max(data.frameworks.length, 1) + Math.PI / 2;
      const id = `framework-${f.id}`;
      entityLookup.set(id, f as unknown as Record<string, unknown>);
      addNode(id, 'framework',
        { x: centerX + modelRadius * Math.cos(angle) - 400, y: centerY + 150 + modelRadius * Math.sin(angle) },
        f.name,
        entityColors.framework,
        { rawData: f }
      );
    });

    // Model → Framework edges
    if (visibleEntities.includes('models') && shouldShowEdge('complies with')) {
      data.models.forEach(m => {
        const sourceId = `model-${m.id}`;
        if (!createdNodeIds.has(sourceId) || !m.frameworks?.length) return;
        m.frameworks.forEach(fid => {
          const targetId = `framework-${fid}`;
          if (createdNodeIds.has(targetId)) {
            edges.push(createEdge(`model-${m.id}-framework-${fid}`, sourceId, targetId, 'complies with', entityColors.framework, { dashed: true }));
          }
        });
      });
    }
  }

  return { nodes, edges, entityLookup };
}

/** Get connected entities for sidebar display */
export function getConnectedEntities(
  nodeId: string,
  edges: Edge[],
  entityLookup: Map<string, Record<string, unknown>>
): Array<{ type: string; count: number; items: Array<{ id: string; label: string }> }> {
  const connected = new Map<string, { id: string; label: string }[]>();

  edges.forEach(edge => {
    const connectedId = edge.source === nodeId ? edge.target : edge.target === nodeId ? edge.source : null;
    if (!connectedId) return;

    const [type] = connectedId.split('-');
    const entity = entityLookup.get(connectedId);
    if (!entity) return;

    const label = (entity as { project_title?: string }).project_title
      || (entity as { model?: string }).model
      || (entity as { vendor_name?: string }).vendor_name
      || (entity as { risk_name?: string }).risk_name
      || (entity as { title?: string }).title
      || (entity as { name?: string }).name
      || 'Unknown';

    const items = connected.get(type) || [];
    items.push({ id: connectedId, label });
    connected.set(type, items);
  });

  return Array.from(connected.entries()).map(([type, items]) => ({ type, count: items.length, items }));
}
