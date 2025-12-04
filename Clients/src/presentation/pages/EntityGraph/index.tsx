import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  Position,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Typography, CircularProgress, Chip, Stack, ToggleButton, ToggleButtonGroup, TextField, InputAdornment, Switch } from '@mui/material';
import { Search, AlertTriangle } from 'lucide-react';
import { fetchEntityGraphData, EntityGraphData } from '../../../application/repository/entityGraph.repository';
import EntityNode from './EntityNode';
import DetailSidebar, { EntityDetails } from './DetailSidebar';

// Node type colors
const nodeColors = {
  project: '#13715B',
  model: '#2196F3',
  modelRisk: '#f44336',
  vendor: '#9c27b0',
  vendorRisk: '#ff9800',
  projectRisk: '#e91e63',
  framework: '#00bcd4',
};

// Risk level priority for coloring
const riskPriority: Record<string, number> = {
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

// Custom node types
const nodeTypes = {
  entity: EntityNode,
};

interface ExtendedNodeData {
  label: string;
  sublabel?: string;
  entityType: string;
  color: string;
  status?: string;
  riskLevel?: string;
  rawData?: Record<string, unknown>;
  hasHighRisk?: boolean;
  connectedRiskCount?: number;
  [key: string]: unknown;
}

// Generate nodes and edges from entity data
function generateNodesAndEdges(
  data: EntityGraphData,
  visibleEntities: string[],
  showProblemsOnly: boolean,
  searchQuery: string
): { nodes: Node[]; edges: Edge[]; entityLookup: Map<string, Record<string, unknown>> } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const entityLookup = new Map<string, Record<string, unknown>>();

  // Layout configuration
  const centerX = 600;
  const centerY = 400;
  const projectRadius = 200;
  const modelRadius = 400;
  const vendorRadius = 400;
  const riskRadius = 550;

  // Filter non-organizational projects
  const regularProjects = data.projects.filter(p => !(p as { is_organizational?: boolean }).is_organizational);

  // Calculate risk counts for each entity
  const modelRiskCounts = new Map<number, number>();
  const projectRiskCounts = new Map<number, number>();
  const vendorRiskCounts = new Map<number, number>();

  data.modelRisks.forEach(risk => {
    if (risk.model_id) {
      modelRiskCounts.set(risk.model_id, (modelRiskCounts.get(risk.model_id) || 0) + 1);
    }
  });

  data.projectRisks.forEach(risk => {
    projectRiskCounts.set(risk.project_id, (projectRiskCounts.get(risk.project_id) || 0) + 1);
  });

  data.vendorRisks.forEach(risk => {
    vendorRiskCounts.set(risk.vendor_id, (vendorRiskCounts.get(risk.vendor_id) || 0) + 1);
  });

  // Check if entity has high risk
  const hasHighRisk = (riskLevel?: string) => {
    return riskLevel && riskPriority[riskLevel] >= 3;
  };

  // Filter by search query
  const matchesSearch = (label: string, sublabel?: string) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return label.toLowerCase().includes(query) || (sublabel?.toLowerCase().includes(query) ?? false);
  };

  // Add project nodes in a circle at the center
  if (visibleEntities.includes('projects')) {
    regularProjects.forEach((project, index) => {
      const riskCount = projectRiskCounts.get(project.id) || 0;
      const projectHasHighRisk = data.projectRisks.some(
        r => r.project_id === project.id && hasHighRisk(r.current_risk_level)
      );

      if (showProblemsOnly && !projectHasHighRisk && riskCount === 0) return;
      if (!matchesSearch(project.uc_id || project.project_title, project.project_title)) return;

      const angle = (2 * Math.PI * index) / Math.max(regularProjects.length, 1);
      const nodeId = `project-${project.id}`;

      entityLookup.set(nodeId, project as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + projectRadius * Math.cos(angle),
          y: centerY + projectRadius * Math.sin(angle),
        },
        data: {
          label: project.uc_id || project.project_title,
          sublabel: project.project_title,
          entityType: 'project',
          color: projectHasHighRisk ? nodeColors.projectRisk : nodeColors.project,
          hasHighRisk: projectHasHighRisk,
          connectedRiskCount: riskCount,
          rawData: project,
        } as ExtendedNodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });
  }

  // Add model inventory nodes
  if (visibleEntities.includes('models')) {
    data.modelInventories.forEach((model, index) => {
      const riskCount = modelRiskCounts.get(model.id) || 0;
      const modelHasHighRisk = data.modelRisks.some(
        r => r.model_id === model.id && hasHighRisk(r.risk_level)
      );

      if (showProblemsOnly && !modelHasHighRisk && riskCount === 0) return;
      if (!matchesSearch(model.model, model.provider)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.modelInventories.length, 1) - Math.PI / 4;
      const nodeId = `model-${model.id}`;

      entityLookup.set(nodeId, model as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + modelRadius * Math.cos(angle) - 300,
          y: centerY + modelRadius * Math.sin(angle),
        },
        data: {
          label: model.model,
          sublabel: model.provider,
          entityType: 'model',
          color: modelHasHighRisk ? nodeColors.modelRisk : nodeColors.model,
          status: model.status,
          hasHighRisk: modelHasHighRisk,
          connectedRiskCount: riskCount,
          rawData: model,
        } as ExtendedNodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Connect models to their projects
      if (visibleEntities.includes('projects') && model.projects?.length) {
        model.projects.forEach((projectId) => {
          edges.push({
            id: `model-${model.id}-project-${projectId}`,
            source: `model-${model.id}`,
            target: `project-${projectId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: modelHasHighRisk ? nodeColors.modelRisk : nodeColors.model, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: modelHasHighRisk ? nodeColors.modelRisk : nodeColors.model },
          });
        });
      }
    });
  }

  // Add framework nodes
  if (visibleEntities.includes('frameworks')) {
    data.frameworks.forEach((framework, index) => {
      if (!matchesSearch(framework.name)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.frameworks.length, 1) + Math.PI / 3;
      const nodeId = `framework-${framework.id}`;

      entityLookup.set(nodeId, framework as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + modelRadius * Math.cos(angle) - 400,
          y: centerY + 200 + modelRadius * Math.sin(angle),
        },
        data: {
          label: framework.name,
          entityType: 'framework',
          color: nodeColors.framework,
          rawData: framework,
        } as ExtendedNodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });

    // Connect models to frameworks
    if (visibleEntities.includes('models')) {
      data.modelInventories.forEach((model) => {
        if (model.frameworks?.length) {
          model.frameworks.forEach((frameworkId) => {
            edges.push({
              id: `model-${model.id}-framework-${frameworkId}`,
              source: `model-${model.id}`,
              target: `framework-${frameworkId}`,
              type: 'smoothstep',
              style: { stroke: nodeColors.framework, strokeWidth: 1, strokeDasharray: '5,5' },
            });
          });
        }
      });
    }
  }

  // Add model risk nodes
  if (visibleEntities.includes('modelRisks')) {
    data.modelRisks.forEach((risk, index) => {
      const isHighRisk = hasHighRisk(risk.risk_level);
      if (showProblemsOnly && !isHighRisk) return;
      if (!matchesSearch(risk.risk_name)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.modelRisks.length, 1) - Math.PI / 2;
      const nodeId = `modelRisk-${risk.id}`;

      entityLookup.set(nodeId, risk as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + riskRadius * Math.cos(angle) - 500,
          y: centerY + riskRadius * Math.sin(angle),
        },
        data: {
          label: risk.risk_name,
          entityType: 'modelRisk',
          color: nodeColors.modelRisk,
          riskLevel: risk.risk_level,
          hasHighRisk: isHighRisk,
          rawData: risk,
        } as ExtendedNodeData,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Connect model risks to models
      if (visibleEntities.includes('models') && risk.model_id) {
        edges.push({
          id: `modelRisk-${risk.id}-model-${risk.model_id}`,
          source: `modelRisk-${risk.id}`,
          target: `model-${risk.model_id}`,
          type: 'smoothstep',
          style: { stroke: nodeColors.modelRisk, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: nodeColors.modelRisk },
        });
      }
    });
  }

  // Add vendor nodes
  if (visibleEntities.includes('vendors')) {
    data.vendors.forEach((vendor, index) => {
      const riskCount = vendorRiskCounts.get(vendor.id) || 0;
      const vendorHasHighRisk = data.vendorRisks.some(
        r => r.vendor_id === vendor.id && hasHighRisk(r.risk_severity)
      );

      if (showProblemsOnly && !vendorHasHighRisk && riskCount === 0) return;
      if (!matchesSearch(vendor.vendor_name)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.vendors.length, 1) + Math.PI / 4;
      const nodeId = `vendor-${vendor.id}`;

      entityLookup.set(nodeId, vendor as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + vendorRadius * Math.cos(angle) + 300,
          y: centerY + vendorRadius * Math.sin(angle),
        },
        data: {
          label: vendor.vendor_name,
          entityType: 'vendor',
          color: vendorHasHighRisk ? nodeColors.vendorRisk : nodeColors.vendor,
          status: vendor.review_status,
          hasHighRisk: vendorHasHighRisk,
          connectedRiskCount: riskCount,
          rawData: vendor,
        } as ExtendedNodeData,
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
      });

      // Connect vendors to projects
      if (visibleEntities.includes('projects') && vendor.projects?.length) {
        vendor.projects.forEach((projectId) => {
          edges.push({
            id: `vendor-${vendor.id}-project-${projectId}`,
            source: `vendor-${vendor.id}`,
            target: `project-${projectId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: vendorHasHighRisk ? nodeColors.vendorRisk : nodeColors.vendor, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: vendorHasHighRisk ? nodeColors.vendorRisk : nodeColors.vendor },
          });
        });
      }
    });
  }

  // Add vendor risk nodes
  if (visibleEntities.includes('vendorRisks')) {
    data.vendorRisks.forEach((risk, index) => {
      const isHighRisk = hasHighRisk(risk.risk_severity);
      if (showProblemsOnly && !isHighRisk) return;
      if (!matchesSearch(risk.risk_description || '')) return;

      const angle = (2 * Math.PI * index) / Math.max(data.vendorRisks.length, 1) + Math.PI / 2;
      const nodeId = `vendorRisk-${risk.id}`;

      entityLookup.set(nodeId, risk as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + riskRadius * Math.cos(angle) + 500,
          y: centerY + riskRadius * Math.sin(angle),
        },
        data: {
          label: risk.risk_description?.substring(0, 30) + ((risk.risk_description?.length || 0) > 30 ? '...' : ''),
          entityType: 'vendorRisk',
          color: nodeColors.vendorRisk,
          riskLevel: risk.risk_severity,
          hasHighRisk: isHighRisk,
          rawData: risk,
        } as ExtendedNodeData,
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
      });

      // Connect vendor risks to vendors
      if (visibleEntities.includes('vendors') && risk.vendor_id) {
        edges.push({
          id: `vendorRisk-${risk.id}-vendor-${risk.vendor_id}`,
          source: `vendorRisk-${risk.id}`,
          target: `vendor-${risk.vendor_id}`,
          type: 'smoothstep',
          style: { stroke: nodeColors.vendorRisk, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: nodeColors.vendorRisk },
        });
      }
    });
  }

  // Add project risk nodes
  if (visibleEntities.includes('projectRisks')) {
    data.projectRisks.forEach((risk, index) => {
      const isHighRisk = hasHighRisk(risk.current_risk_level);
      if (showProblemsOnly && !isHighRisk) return;
      if (!matchesSearch(risk.risk_name)) return;

      const angle = (2 * Math.PI * index) / Math.max(data.projectRisks.length, 1);
      const nodeId = `projectRisk-${risk.id}`;

      entityLookup.set(nodeId, risk as unknown as Record<string, unknown>);

      nodes.push({
        id: nodeId,
        type: 'entity',
        position: {
          x: centerX + riskRadius * Math.cos(angle),
          y: centerY + riskRadius * Math.sin(angle) + 200,
        },
        data: {
          label: risk.risk_name,
          entityType: 'projectRisk',
          color: nodeColors.projectRisk,
          riskLevel: risk.current_risk_level,
          hasHighRisk: isHighRisk,
          rawData: risk,
        } as ExtendedNodeData,
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      });

      // Connect project risks to projects
      if (visibleEntities.includes('projects') && risk.project_id) {
        edges.push({
          id: `projectRisk-${risk.id}-project-${risk.project_id}`,
          source: `projectRisk-${risk.id}`,
          target: `project-${risk.project_id}`,
          type: 'smoothstep',
          style: { stroke: nodeColors.projectRisk, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: nodeColors.projectRisk },
        });
      }
    });
  }

  return { nodes, edges, entityLookup };
}

// Helper to get connected entities for sidebar
function getConnectedEntities(
  nodeId: string,
  edges: Edge[],
  entityLookup: Map<string, Record<string, unknown>>
): EntityDetails['connectedEntities'] {
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
        const label = (entity as { project_title?: string; model?: string; vendor_name?: string; risk_name?: string; name?: string; risk_description?: string }).project_title
          || (entity as { model?: string }).model
          || (entity as { vendor_name?: string }).vendor_name
          || (entity as { risk_name?: string }).risk_name
          || (entity as { name?: string }).name
          || (entity as { risk_description?: string }).risk_description?.substring(0, 30)
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

const EntityGraphInner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityData, setEntityData] = useState<EntityGraphData | null>(null);
  const [visibleEntities, setVisibleEntities] = useState<string[]>([
    'projects', 'models', 'vendors', 'frameworks'
  ]);
  const [selectedEntity, setSelectedEntity] = useState<EntityDetails | null>(null);
  const [entityLookup, setEntityLookup] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { fitView } = useReactFlow();

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchEntityGraphData();
        setEntityData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load entity data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update nodes and edges when data or filters change
  useEffect(() => {
    if (entityData) {
      const { nodes: newNodes, edges: newEdges, entityLookup: newLookup } = generateNodesAndEdges(
        entityData,
        visibleEntities,
        showProblemsOnly,
        searchQuery
      );
      setNodes(newNodes);
      setEdges(newEdges);
      setEntityLookup(newLookup);

      // Fit view after updating nodes
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [entityData, visibleEntities, showProblemsOnly, searchQuery, setNodes, setEdges, fitView]);

  const handleVisibilityChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newVisibility: string[]) => {
      if (newVisibility.length > 0) {
        setVisibleEntities(newVisibility);
      }
    },
    []
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as ExtendedNodeData;
      const connectedEntities = getConnectedEntities(node.id, edges, entityLookup);

      setSelectedEntity({
        id: node.id,
        entityType: nodeData.entityType as EntityDetails['entityType'],
        label: nodeData.label,
        sublabel: nodeData.sublabel,
        color: nodeData.color,
        status: nodeData.status,
        riskLevel: nodeData.riskLevel,
        rawData: nodeData.rawData,
        connectedEntities,
      });
    },
    [edges, entityLookup]
  );

  const handleCloseSidebar = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  const handleNavigateToEntity = useCallback(
    (_entityType: string, id: string) => {
      const node = nodes.find(n => n.id === id);
      if (node) {
        handleNodeClick({} as React.MouseEvent, node);
      }
    },
    [nodes, handleNodeClick]
  );

  // Entity counts for legend
  const entityCounts = useMemo(() => {
    if (!entityData) return null;
    return {
      projects: entityData.projects.filter(p => !(p as { is_organizational?: boolean }).is_organizational).length,
      models: entityData.modelInventories.length,
      modelRisks: entityData.modelRisks.length,
      vendors: entityData.vendors.length,
      vendorRisks: entityData.vendorRisks.length,
      projectRisks: entityData.projectRisks.length,
      frameworks: entityData.frameworks.length,
    };
  }, [entityData]);

  // Problem counts
  const problemCounts = useMemo(() => {
    if (!entityData) return { total: 0, high: 0 };
    let high = 0;

    entityData.modelRisks.forEach(r => {
      if (riskPriority[r.risk_level] >= 3) high++;
    });
    entityData.vendorRisks.forEach(r => {
      if (riskPriority[r.risk_severity] >= 3) high++;
    });
    entityData.projectRisks.forEach(r => {
      if (riskPriority[r.current_risk_level] >= 3) high++;
    });

    return { total: high, high };
  }, [entityData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading entity graph...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 64px)', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <MiniMap
          nodeStrokeColor={(node) => (node.data as { color?: string })?.color || '#888'}
          nodeColor={(node) => (node.data as { color?: string })?.color || '#fff'}
          nodeBorderRadius={4}
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e0e0e0" />

        {/* Search and Filter Panel */}
        <Panel position="top-left">
          <Box sx={{
            backgroundColor: 'white',
            p: 2,
            borderRadius: '4px',
            border: '1px solid #d0d5dd',
            maxWidth: 340,
          }}>
            {/* Search */}
            <TextField
              size="small"
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              sx={{ mb: 1.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#667085" />
                  </InputAdornment>
                ),
                sx: { fontSize: 13, height: 34 },
              }}
            />

            {/* Problems filter */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
              p: 1,
              backgroundColor: showProblemsOnly ? '#fef3f2' : '#f9fafb',
              borderRadius: '4px',
              border: `1px solid ${showProblemsOnly ? '#fecaca' : '#e5e7eb'}`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle size={14} color={showProblemsOnly ? '#dc2626' : '#667085'} />
                <Typography sx={{ fontSize: 12, color: showProblemsOnly ? '#dc2626' : '#344054' }}>
                  Show problems only
                </Typography>
                {problemCounts.high > 0 && (
                  <Chip
                    size="small"
                    label={problemCounts.high}
                    sx={{
                      height: 18,
                      fontSize: 10,
                      backgroundColor: '#dc2626',
                      color: 'white'
                    }}
                  />
                )}
              </Box>
              <Switch
                size="small"
                checked={showProblemsOnly}
                onChange={(e) => setShowProblemsOnly(e.target.checked)}
              />
            </Box>

            {/* Entity visibility */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: 12 }}>
              Entity visibility
            </Typography>
            <ToggleButtonGroup
              value={visibleEntities}
              onChange={handleVisibilityChange}
              aria-label="entity visibility"
              size="small"
              sx={{ flexWrap: 'wrap', gap: 0.5 }}
            >
              <ToggleButton value="projects" sx={{ fontSize: 11, py: 0.5 }}>
                Use cases ({entityCounts?.projects || 0})
              </ToggleButton>
              <ToggleButton value="models" sx={{ fontSize: 11, py: 0.5 }}>
                Models ({entityCounts?.models || 0})
              </ToggleButton>
              <ToggleButton value="vendors" sx={{ fontSize: 11, py: 0.5 }}>
                Vendors ({entityCounts?.vendors || 0})
              </ToggleButton>
              <ToggleButton value="frameworks" sx={{ fontSize: 11, py: 0.5 }}>
                Frameworks ({entityCounts?.frameworks || 0})
              </ToggleButton>
              <ToggleButton value="modelRisks" sx={{ fontSize: 11, py: 0.5 }}>
                Model risks ({entityCounts?.modelRisks || 0})
              </ToggleButton>
              <ToggleButton value="vendorRisks" sx={{ fontSize: 11, py: 0.5 }}>
                Vendor risks ({entityCounts?.vendorRisks || 0})
              </ToggleButton>
              <ToggleButton value="projectRisks" sx={{ fontSize: 11, py: 0.5 }}>
                Project risks ({entityCounts?.projectRisks || 0})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Panel>

        {/* Legend */}
        <Panel position="top-right">
          <Box sx={{
            backgroundColor: 'white',
            p: 2,
            borderRadius: '4px',
            border: '1px solid #d0d5dd',
            marginRight: selectedEntity ? '370px' : 0,
            transition: 'margin-right 0.2s ease',
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: 12 }}>
              Legend
            </Typography>
            <Stack spacing={0.5}>
              <Chip size="small" label="Use cases" sx={{ bgcolor: nodeColors.project, color: 'white', fontSize: 11 }} />
              <Chip size="small" label="Models" sx={{ bgcolor: nodeColors.model, color: 'white', fontSize: 11 }} />
              <Chip size="small" label="Model risks" sx={{ bgcolor: nodeColors.modelRisk, color: 'white', fontSize: 11 }} />
              <Chip size="small" label="Vendors" sx={{ bgcolor: nodeColors.vendor, color: 'white', fontSize: 11 }} />
              <Chip size="small" label="Vendor risks" sx={{ bgcolor: nodeColors.vendorRisk, color: 'white', fontSize: 11 }} />
              <Chip size="small" label="Project risks" sx={{ bgcolor: nodeColors.projectRisk, color: 'white', fontSize: 11 }} />
              <Chip size="small" label="Frameworks" sx={{ bgcolor: nodeColors.framework, color: 'white', fontSize: 11 }} />
            </Stack>
            <Typography sx={{ fontSize: 10, color: '#667085', mt: 1.5, fontStyle: 'italic' }}>
              Click any node for details
            </Typography>
          </Box>
        </Panel>
      </ReactFlow>

      {/* Detail Sidebar */}
      <DetailSidebar
        entity={selectedEntity}
        onClose={handleCloseSidebar}
        onNavigateToEntity={handleNavigateToEntity}
      />
    </Box>
  );
};

// Wrap with ReactFlowProvider for useReactFlow hook
const EntityGraph: React.FC = () => {
  return (
    <ReactFlowProvider>
      <EntityGraphInner />
    </ReactFlowProvider>
  );
};

export default EntityGraph;
