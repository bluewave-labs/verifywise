import React, { useCallback, useEffect, useState, useRef } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Typography, Stack, ToggleButton, ToggleButtonGroup, LinearProgress } from '@mui/material';
import { AlertTriangle, GitBranch } from 'lucide-react';
import Toggle from '../../components/Inputs/Toggle';
import SearchBox from '../../components/Search/SearchBox';
import { fetchEntityGraphData, EntityGraphData } from '../../../application/repository/entityGraph.repository';
import EntityNode from './EntityNode';
import DetailSidebar, { EntityDetails } from './DetailSidebar';
import { useEntityGraphFocus } from '../../contexts/EntityGraphFocusContext';
import { entityColors } from './constants';
import type { ExtendedNodeData } from './types';
import { generateNodesAndEdges, getConnectedEntities } from './utils';

const nodeTypes = { entity: EntityNode };

const ENTITY_TYPE_MAP: Record<string, string> = {
  model: 'models', vendor: 'vendors', risk: 'risks', control: 'controls',
  useCase: 'useCases', evidence: 'evidence', framework: 'frameworks',
};

const EntityGraphInner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [entityData, setEntityData] = useState<EntityGraphData | null>(null);
  const [visibleEntities, setVisibleEntities] = useState<string[]>(['useCases', 'models', 'vendors', 'risks']);
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<EntityDetails | null>(null);
  const [entityLookup, setEntityLookup] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const { fitView, setCenter } = useReactFlow();
  const { focusEntity } = useEntityGraphFocus();
  const hasFocusedOnEntity = useRef(false);

  // Handle focus entity - ensure visibility and reset filters
  useEffect(() => {
    if (!focusEntity) return;
    hasFocusedOnEntity.current = false;
    const pluralType = ENTITY_TYPE_MAP[focusEntity.type];
    if (pluralType) {
      setVisibleEntities(prev => prev.includes(pluralType) ? prev : [...prev, pluralType]);
    }
    setShowProblemsOnly(false);
    setSearchQuery('');
  }, [focusEntity?.id, focusEntity?.type]);

  // Center on focused entity once nodes are loaded
  useEffect(() => {
    if (!focusEntity || loading || nodes.length === 0 || hasFocusedOnEntity.current) return;
    let targetNode = nodes.find(n => n.id === focusEntity.id);
    if (!targetNode) {
      const idPart = focusEntity.id.split('-')[1];
      targetNode = nodes.find(n => n.id.startsWith(`${focusEntity.type}-`) && n.id.includes(idPart));
    }
    if (targetNode) {
      setTimeout(() => {
        setCenter(targetNode.position.x + 75, targetNode.position.y + 30, { zoom: 1.2, duration: 800 });
        hasFocusedOnEntity.current = true;
        setHighlightedNodeId(targetNode.id);
        setTimeout(() => setHighlightedNodeId(null), 1500);
      }, 500);
    }
  }, [focusEntity, loading, nodes, setCenter]);

  // Update nodes with highlight state
  useEffect(() => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: { ...node.data, isHighlighted: node.id === highlightedNodeId },
    })));
  }, [highlightedNodeId, setNodes]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);
        const data = await fetchEntityGraphData((loaded, total) => setLoadingProgress(Math.round((loaded / total) * 100)));
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
    if (!entityData) return;
    const { nodes: newNodes, edges: newEdges, entityLookup: newLookup } = generateNodesAndEdges(entityData, {
      visibleEntities, showProblemsOnly, searchQuery: debouncedSearchQuery, visibleRelationships: [],
    });
    setNodes(newNodes);
    setEdges(newEdges);
    setEntityLookup(newLookup);
    const timeoutId = setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
    return () => clearTimeout(timeoutId);
  }, [entityData, visibleEntities, showProblemsOnly, debouncedSearchQuery, setNodes, setEdges, fitView]);

  const handleVisibilityChange = useCallback((_: React.MouseEvent<HTMLElement>, v: string[]) => {
    if (v.length > 0) setVisibleEntities(v);
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const data = node.data as ExtendedNodeData;
    setSelectedEntity({
      id: node.id,
      entityType: data.entityType as EntityDetails['entityType'],
      label: data.label, sublabel: data.sublabel, color: data.color,
      status: data.status, riskLevel: data.riskLevel, rawData: data.rawData,
      connectedEntities: getConnectedEntities(node.id, edges, entityLookup),
    });
  }, [edges, entityLookup]);

  const handleNavigateToEntity = useCallback((_: string, id: string) => {
    const node = nodes.find(n => n.id === id);
    if (node) handleNodeClick({} as React.MouseEvent, node);
  }, [nodes, handleNodeClick]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <Typography sx={{ fontSize: 14, color: '#667085' }}>Loading entity graph...</Typography>
        <LinearProgress variant="determinate" value={loadingProgress} sx={{ width: 300, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb', '& .MuiLinearProgress-bar': { backgroundColor: '#13715B', borderRadius: 4 } }} />
        <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>{loadingProgress}% complete</Typography>
      </Box>
    );
  }

  if (error) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Typography color="error">{error}</Typography></Box>;
  }

  const hasNoData = entityData && !entityData.useCases.length && !entityData.models.length && !entityData.vendors.length && !entityData.risks.length;
  if (hasNoData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)', gap: 2, backgroundColor: '#fafafa' }}>
        <GitBranch size={48} color="#9ca3af" />
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#344054' }}>No entities to display</Typography>
        <Typography sx={{ fontSize: 13, color: '#667085', textAlign: 'center', maxWidth: 300 }}>Add use cases, models, or vendors to visualize compliance relationships.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', backgroundColor: '#fafafa', position: 'relative' }}>
      <ReactFlow
        nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick} nodeTypes={nodeTypes} fitView minZoom={0.1} maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} style={{ bottom: 20, left: 20 }} />
        <MiniMap nodeColor={n => (n.data as ExtendedNodeData)?.color || '#667085'} maskColor="rgba(0,0,0,0.1)" style={{ bottom: 20, right: 20 }} />

        <Panel position="top-left">
          <Stack spacing={1.5} sx={{ p: 2, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #d0d5dd', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minWidth: 280, maxWidth: 320 }}>
            <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search entities..." />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle size={14} color="#f59e0b" />
                <Typography sx={{ fontSize: 12, color: '#344054' }}>Show problems only</Typography>
              </Box>
              <Toggle size="small" checked={showProblemsOnly} onChange={e => setShowProblemsOnly(e.target.checked)} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#667085', mb: 1 }}>Entity types</Typography>
              <ToggleButtonGroup value={visibleEntities} onChange={handleVisibilityChange} size="small" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButton-root': { border: '1px solid #d0d5dd', borderRadius: '4px !important', textTransform: 'none', fontSize: 11, py: 0.5, px: 1, '&.Mui-selected': { backgroundColor: '#f0fdf4', borderColor: '#13715B', color: '#13715B' } } }}>
                {[['useCases', 'useCase', 'Use cases'], ['models', 'model', 'Models'], ['vendors', 'vendor', 'Vendors'], ['risks', 'risk', 'Risks'], ['controls', 'control', 'Controls'], ['evidence', 'evidence', 'Evidence'], ['frameworks', 'framework', 'Frameworks']].map(([val, colorKey, label]) => (
                  <ToggleButton key={val} value={val}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors[colorKey as keyof typeof entityColors], mr: 0.5 }} />
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ pt: 1, borderTop: '1px solid #e5e7eb' }}>
              <Typography sx={{ fontSize: 11, color: '#667085' }}>Showing {nodes.length} entities, {edges.length} relationships</Typography>
            </Box>
          </Stack>
        </Panel>
      </ReactFlow>
      <DetailSidebar entity={selectedEntity} onClose={() => setSelectedEntity(null)} onNavigateToEntity={handleNavigateToEntity} />
    </Box>
  );
};

const EntityGraph: React.FC = () => (
  <ReactFlowProvider>
    <EntityGraphInner />
  </ReactFlowProvider>
);

export default EntityGraph;
