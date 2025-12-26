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
import {
  Box,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Button,
} from '@mui/material';
import { AlertTriangle, GitBranch } from 'lucide-react';
import Toggle from '../../components/Inputs/Toggle';
import SearchBox from '../../components/Search/SearchBox';
import { fetchEntityGraphData, EntityGraphData } from '../../../application/repository/entityGraph.repository';
import EntityNode from './EntityNode';
import DetailSidebar, { EntityDetails } from './DetailSidebar';
import { useEntityGraphFocus } from '../../contexts/EntityGraphFocusContext';

// Import extracted modules
import { entityColors } from './constants';
import type { ExtendedNodeData } from './types';
import { generateNodesAndEdges, getConnectedEntities } from './utils';

// Custom node types
const nodeTypes = {
  entity: EntityNode,
};

const EntityGraphInner: React.FC = () => {
  // Core state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [entityData, setEntityData] = useState<EntityGraphData | null>(null);

  // Filter state
  const [visibleEntities, setVisibleEntities] = useState<string[]>([
    'useCases', 'models', 'vendors', 'risks'
  ]);
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Selection state
  const [selectedEntity, setSelectedEntity] = useState<EntityDetails | null>(null);
  const [entityLookup, setEntityLookup] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, setCenter } = useReactFlow();
  const { focusEntity } = useEntityGraphFocus();
  const hasFocusedOnEntity = useRef(false);

  // Reset focus flag when focus entity changes
  useEffect(() => {
    if (focusEntity) {
      hasFocusedOnEntity.current = false;
    }
  }, [focusEntity?.id]);

  // Ensure the focused entity type is visible
  useEffect(() => {
    if (focusEntity?.type) {
      const entityTypeMap: Record<string, string> = {
        model: 'models',
        vendor: 'vendors',
        risk: 'risks',
        control: 'controls',
        useCase: 'useCases',
        evidence: 'evidence',
        framework: 'frameworks',
      };
      const pluralType = entityTypeMap[focusEntity.type];
      if (pluralType) {
        setVisibleEntities(prev =>
          prev.includes(pluralType) ? prev : [...prev, pluralType]
        );
      }
      setShowProblemsOnly(false);
      setSearchQuery('');
    }
  }, [focusEntity?.type]);

  // Focus on specific entity when provided via context
  useEffect(() => {
    if (focusEntity && !loading && nodes.length > 0 && !hasFocusedOnEntity.current) {
      let targetNode = nodes.find(n => n.id === focusEntity.id);

      if (!targetNode) {
        const idPart = focusEntity.id.split('-')[1];
        targetNode = nodes.find(n => n.id.startsWith(`${focusEntity.type}-`) && n.id.includes(idPart));
      }

      if (targetNode) {
        setTimeout(() => {
          setCenter(
            targetNode.position.x + 75,
            targetNode.position.y + 30,
            { zoom: 1.2, duration: 800 }
          );
          hasFocusedOnEntity.current = true;
          setHighlightedNodeId(targetNode.id);
          setTimeout(() => setHighlightedNodeId(null), 1500);
        }, 500);
      }
    }
  }, [focusEntity, loading, nodes, setCenter]);

  // Update nodes with highlight state
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isHighlighted: node.id === highlightedNodeId,
        },
      }))
    );
  }, [highlightedNodeId, setNodes]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingProgress(0);
        const data = await fetchEntityGraphData((loaded, total) => {
          setLoadingProgress(Math.round((loaded / total) * 100));
        });
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

    const { nodes: newNodes, edges: newEdges, entityLookup: newLookup } = generateNodesAndEdges(
      entityData,
      {
        visibleEntities,
        showProblemsOnly,
        searchQuery: debouncedSearchQuery,
        visibleRelationships: [], // Show all relationships
      }
    );
    setNodes(newNodes);
    setEdges(newEdges);
    setEntityLookup(newLookup);

    const timeoutId = setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
    return () => clearTimeout(timeoutId);
  }, [entityData, visibleEntities, showProblemsOnly, debouncedSearchQuery, setNodes, setEdges, fitView]);

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
        handleNodeClick({ ctrlKey: false, shiftKey: false, metaKey: false } as React.MouseEvent, node);
      }
    },
    [nodes, handleNodeClick]
  );

  // Loading state
  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        gap: 2,
        p: 4,
      }}>
        <Typography sx={{ fontSize: 14, color: '#667085' }}>
          Loading entity graph...
        </Typography>
        <Box sx={{ width: '300px' }}>
          <LinearProgress
            variant="determinate"
            value={loadingProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e5e7eb',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#13715B',
                borderRadius: 4,
              }
            }}
          />
        </Box>
        <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
          {loadingProgress}% complete
        </Typography>
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

  // Empty state
  const hasNoData = entityData &&
    entityData.useCases.length === 0 &&
    entityData.models.length === 0 &&
    entityData.vendors.length === 0 &&
    entityData.risks.length === 0;

  if (hasNoData) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'calc(100vh - 64px)',
        gap: 3,
        p: 4,
        backgroundColor: '#fafafa',
      }}>
        <Box sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <GitBranch size={48} color="#9ca3af" />
        </Box>
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#344054', mb: 1 }}>
            No entities to display
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#667085', mb: 3 }}>
            Start by adding use cases, models, or vendors to visualize your compliance relationships.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="small"
            href="/project-view"
            sx={{
              textTransform: 'none',
              borderColor: '#d0d5dd',
              color: '#344054',
              '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
            }}
          >
            Add use case
          </Button>
          <Button
            variant="outlined"
            size="small"
            href="/vendors"
            sx={{
              textTransform: 'none',
              borderColor: '#d0d5dd',
              color: '#344054',
              '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
            }}
          >
            Add vendor
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={reactFlowWrapper}
      sx={{
        height: 'calc(100vh - 64px)',
        width: '100%',
        backgroundColor: '#fafafa',
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
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        <Controls
          showInteractive={false}
          style={{ bottom: 20, left: 20 }}
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as ExtendedNodeData;
            return data?.color || '#667085';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{ bottom: 20, right: 20 }}
        />

        {/* Filter Panel */}
        <Panel position="top-left">
          <Stack
            spacing={1.5}
            sx={{
              p: 2,
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #d0d5dd',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              minWidth: 280,
              maxWidth: 320,
            }}
          >
            {/* Search */}
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search entities..."
            />

            {/* Problems filter */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle size={14} color="#f59e0b" />
                <Typography sx={{ fontSize: 12, color: '#344054' }}>Show problems only</Typography>
              </Box>
              <Toggle
                size="small"
                checked={showProblemsOnly}
                onChange={(e) => setShowProblemsOnly(e.target.checked)}
              />
            </Box>

            {/* Entity visibility toggles */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#667085', mb: 1 }}>
                Entity types
              </Typography>
              <ToggleButtonGroup
                value={visibleEntities}
                onChange={handleVisibilityChange}
                size="small"
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  '& .MuiToggleButton-root': {
                    border: '1px solid #d0d5dd',
                    borderRadius: '4px !important',
                    textTransform: 'none',
                    fontSize: 11,
                    py: 0.5,
                    px: 1,
                    '&.Mui-selected': {
                      backgroundColor: '#f0fdf4',
                      borderColor: '#13715B',
                      color: '#13715B',
                    },
                  },
                }}
              >
                <ToggleButton value="useCases">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.useCase, mr: 0.5 }} />
                  Use cases
                </ToggleButton>
                <ToggleButton value="models">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.model, mr: 0.5 }} />
                  Models
                </ToggleButton>
                <ToggleButton value="vendors">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.vendor, mr: 0.5 }} />
                  Vendors
                </ToggleButton>
                <ToggleButton value="risks">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.risk, mr: 0.5 }} />
                  Risks
                </ToggleButton>
                <ToggleButton value="controls">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.control, mr: 0.5 }} />
                  Controls
                </ToggleButton>
                <ToggleButton value="evidence">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.evidence, mr: 0.5 }} />
                  Evidence
                </ToggleButton>
                <ToggleButton value="frameworks">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.framework, mr: 0.5 }} />
                  Frameworks
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Stats */}
            <Box sx={{ pt: 1, borderTop: '1px solid #e5e7eb' }}>
              <Typography sx={{ fontSize: 11, color: '#667085' }}>
                Showing {nodes.length} entities, {edges.length} relationships
              </Typography>
            </Box>
          </Stack>
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

// Wrap with ReactFlowProvider
const EntityGraph: React.FC = () => {
  return (
    <ReactFlowProvider>
      <EntityGraphInner />
    </ReactFlowProvider>
  );
};

export default EntityGraph;
