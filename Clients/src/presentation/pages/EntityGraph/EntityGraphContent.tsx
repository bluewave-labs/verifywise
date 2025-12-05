/**
 * EntityGraphContent - Reusable Entity Graph component for modal and page views
 *
 * This component wraps the Entity Graph functionality and can be used:
 * - In a modal with focusEntityId to center on a specific entity
 * - As a standalone page (existing behavior)
 */

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
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
  Panel,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
} from '@mui/material';
import SearchBox from '../../components/Search/SearchBox';
import { fetchEntityGraphData, EntityGraphData } from '../../../application/repository/entityGraph.repository';
import EntityNode, { EntityType } from './EntityNode';
import DetailSidebar, { EntityDetails } from './DetailSidebar';

// Entity type colors following VerifyWise design system
const entityColors: Record<EntityType, string> = {
  useCase: '#13715B',
  model: '#2196F3',
  risk: '#f44336',
  vendor: '#9c27b0',
  control: '#00bcd4',
  evidence: '#ff9800',
  framework: '#607d8b',
  user: '#795548',
};

const nodeTypes = {
  entity: EntityNode,
};

interface ExtendedNodeData {
  label: string;
  sublabel?: string;
  entityType: EntityType;
  color: string;
  status?: string;
  riskLevel?: string;
  rawData?: Record<string, unknown>;
  hasHighRisk?: boolean;
  connectedRiskCount?: number;
  isFocused?: boolean;
  [key: string]: unknown;
}

export interface EntityGraphContentProps {
  isModal?: boolean;
  focusEntityId?: string;
  focusEntityType?: string;
}

const EntityGraphContentInner: React.FC<EntityGraphContentProps> = ({
  focusEntityId,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, , onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityData, setEntityData] = useState<EntityGraphData | null>(null);
  const [visibleEntities, setVisibleEntities] = useState<string[]>([
    'useCases', 'models', 'vendors', 'risks', 'controls'
  ]);
  const [selectedEntity, setSelectedEntity] = useState<EntityDetails | null>(null);
  const [entityLookup, setEntityLookup] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, setCenter } = useReactFlow();
  const hasFocused = useRef(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch entity data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchEntityGraphData();
        setEntityData(data);

        // Build entity lookup for detail view
        const lookup = new Map<string, Record<string, unknown>>();
        data.models?.forEach(m => lookup.set(`model-${m.id}`, m));
        data.risks?.forEach(r => lookup.set(`risk-${r.id}`, r));
        data.vendors?.forEach(v => lookup.set(`vendor-${v.id}`, v));
        data.controls?.forEach(c => lookup.set(`control-${c.id}`, c));
        data.useCases?.forEach(u => lookup.set(`useCase-${u.id}`, u));
        data.evidence?.forEach(e => lookup.set(`evidence-${e.id}`, e));
        setEntityLookup(lookup);

        setError(null);
      } catch (err) {
        setError('Failed to load entity graph data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Build nodes and edges from entity data
  useEffect(() => {
    if (!entityData) return;

    const newNodes: Node[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Calculate layout positions (simple grid for now)
    let xOffset = 0;
    const SPACING_X = 250;
    const SPACING_Y = 150;
    const NODES_PER_ROW = 6;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addNodes = (items: any[], type: EntityType, typeKey: string) => {
      if (!visibleEntities.includes(typeKey)) return;

      items?.forEach((item) => {
        const nodeId = `${type}-${item.id}`;
        const isFocusedNode = focusEntityId === nodeId;

        // Filter by search
        const label = item.name || item.title || item.model || `${type} #${item.id}`;
        if (debouncedSearchQuery && !label.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
          return;
        }

        const x = (xOffset % NODES_PER_ROW) * SPACING_X + 100;
        const y = Math.floor(xOffset / NODES_PER_ROW) * SPACING_Y + 100;
        nodePositions.set(nodeId, { x, y });

        newNodes.push({
          id: nodeId,
          type: 'entity',
          position: { x, y },
          data: {
            label,
            sublabel: item.status || item.severity || '',
            entityType: type,
            color: entityColors[type],
            status: item.status,
            riskLevel: item.severity || item.risk_level,
            rawData: item,
            isFocused: isFocusedNode,
          } as ExtendedNodeData,
        });
        xOffset++;
      });
    };

    // Add nodes by type
    addNodes(entityData.useCases, 'useCase', 'useCases');
    addNodes(entityData.models, 'model', 'models');
    addNodes(entityData.vendors, 'vendor', 'vendors');
    addNodes(entityData.risks, 'risk', 'risks');
    addNodes(entityData.controls, 'control', 'controls');
    addNodes(entityData.evidence, 'evidence', 'evidence');

    setNodes(newNodes);

    // Fit view after layout
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 100);
  }, [entityData, visibleEntities, debouncedSearchQuery, focusEntityId, setNodes, fitView]);

  // Focus on specific entity when provided
  useEffect(() => {
    if (focusEntityId && !loading && nodes.length > 0 && !hasFocused.current) {
      const targetNode = nodes.find(n => n.id === focusEntityId);
      if (targetNode) {
        setTimeout(() => {
          setCenter(targetNode.position.x + 100, targetNode.position.y + 50, {
            zoom: 1.5,
            duration: 500,
          });
          hasFocused.current = true;
        }, 300);
      }
    }
  }, [focusEntityId, loading, nodes, setCenter]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const data = node.data as ExtendedNodeData;
    const rawData = entityLookup.get(node.id) || {};

    setSelectedEntity({
      id: node.id,
      entityType: data.entityType,
      label: data.label,
      sublabel: data.sublabel,
      color: data.color,
      status: data.status,
      riskLevel: data.riskLevel,
      rawData,
    });
  }, [entityLookup]);

  const handleVisibilityChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newVisibility: string[]) => {
      if (newVisibility.length > 0) {
        setVisibleEntities(newVisibility);
      }
    },
    []
  );

  const entityCounts = useMemo(() => ({
    useCases: entityData?.useCases?.length || 0,
    models: entityData?.models?.length || 0,
    vendors: entityData?.vendors?.length || 0,
    risks: entityData?.risks?.length || 0,
    controls: entityData?.controls?.length || 0,
    evidence: entityData?.evidence?.length || 0,
  }), [entityData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <Typography sx={{ color: '#667085' }}>Loading entity graph...</Typography>
        <LinearProgress sx={{ width: 200 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={reactFlowWrapper}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
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
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        selectionMode={SelectionMode.Partial}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        <Controls position="bottom-right" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as ExtendedNodeData;
            return data?.color || '#94a3b8';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          position="bottom-left"
        />

        {/* Control Panel */}
        <Panel position="top-left">
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              p: 2,
              maxWidth: 280,
            }}
          >
            {/* Search */}
            <Box sx={{ mb: 2 }}>
              <SearchBox
                value={searchQuery}
                onChange={(value: string) => setSearchQuery(value)}
                placeholder="Search entities..."
                sx={{ width: '100%' }}
              />
            </Box>

            {/* Entity visibility */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: 12 }}>
              Entity visibility
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
              <ToggleButtonGroup
                value={visibleEntities}
                onChange={handleVisibilityChange}
                aria-label="entity visibility"
                size="small"
                sx={{ display: 'contents' }}
              >
                <ToggleButton value="useCases" sx={{ fontSize: 10, py: 0.5, justifyContent: 'flex-start' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.useCase, mr: 0.5 }} />
                  Use cases ({entityCounts.useCases})
                </ToggleButton>
                <ToggleButton value="models" sx={{ fontSize: 10, py: 0.5, justifyContent: 'flex-start' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.model, mr: 0.5 }} />
                  Models ({entityCounts.models})
                </ToggleButton>
                <ToggleButton value="vendors" sx={{ fontSize: 10, py: 0.5, justifyContent: 'flex-start' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.vendor, mr: 0.5 }} />
                  Vendors ({entityCounts.vendors})
                </ToggleButton>
                <ToggleButton value="risks" sx={{ fontSize: 10, py: 0.5, justifyContent: 'flex-start' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.risk, mr: 0.5 }} />
                  Risks ({entityCounts.risks})
                </ToggleButton>
                <ToggleButton value="controls" sx={{ fontSize: 10, py: 0.5, justifyContent: 'flex-start' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.control, mr: 0.5 }} />
                  Controls ({entityCounts.controls})
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Panel>
      </ReactFlow>

      {/* Detail Sidebar */}
      {selectedEntity && (
        <DetailSidebar
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          onNavigateToEntity={() => {}}
        />
      )}
    </Box>
  );
};

// Wrap with ReactFlowProvider
const EntityGraphContent: React.FC<EntityGraphContentProps> = (props) => {
  return (
    <ReactFlowProvider>
      <EntityGraphContentInner {...props} />
    </ReactFlowProvider>
  );
};

export default EntityGraphContent;
