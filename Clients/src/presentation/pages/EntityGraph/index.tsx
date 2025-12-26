import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Button,
  Menu,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import VWSelect from '../../components/Inputs/Select';
import {
  AlertTriangle,
  Edit3,
  Eye,
  Link2,
  X,
  Download,
  Save,
  FolderOpen,
  Trash2,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Zap,
  Target,
  GitBranch,
  FileImage,
  FileJson,
  Info,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import Toggle from '../../components/Inputs/Toggle';
import Field from '../../components/Inputs/Field';
import SearchBox from '../../components/Search/SearchBox';
import StandardModal from '../../components/Modals/StandardModal';
import VWTooltip from '../../components/VWTooltip';
import Alert from '../../components/Alert';
import PageTour from '../../components/PageTour';
import { handleAlert } from '../../../application/tools/alertUtils';
import { AlertProps } from '../../../domain/interfaces/i.alert';
import { fetchEntityGraphData, EntityGraphData } from '../../../application/repository/entityGraph.repository';
import * as entityGraphUserData from '../../../application/repository/entityGraphUserData.repository';
import EntityNode from './EntityNode';
import DetailSidebar, { EntityDetails } from './DetailSidebar';
import EntityGraphSteps from './EntityGraphSteps';
import { useEntityGraphFocus } from '../../contexts/EntityGraphFocusContext';

// Import extracted modules
import {
  entityColors,
  riskPriority,
  relationshipTypes,
  queryEntityTypes,
  queryConditions,
  queryAttributes,
  STORAGE_KEY,
  LAST_VIEW_KEY,
  GAP_RULES_KEY,
  TOUR_KEY,
  defaultGapRules,
  gapTemplates,
} from './constants';
import type {
  SavedView,
  GapRule,
  GapResult,
  ExtendedNodeData,
} from './types';
import {
  detectGaps,
  findShortestPath,
  getNodesWithinDepth,
  getCompliancePath,
  impactDepthColors,
  generateNodesAndEdges,
  getConnectedEntities,
} from './utils';

// Custom node types
const nodeTypes = {
  entity: EntityNode,
};

// generateNodesAndEdges and getConnectedEntities now imported from ./utils

// Context menu state interface
interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  nodeId: string;
  nodeData: ExtendedNodeData;
}

// Path finding functions now imported from ./utils

const EntityGraphInner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [entityData, setEntityData] = useState<EntityGraphData | null>(null);
  const [visibleEntities, setVisibleEntities] = useState<string[]>([
    'useCases', 'models', 'vendors', 'risks'
  ]);
  const [selectedEntity, setSelectedEntity] = useState<EntityDetails | null>(null);
  const [entityLookup, setEntityLookup] = useState<Map<string, Record<string, unknown>>>(new Map());
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Phase 2: Interaction state
  const [editMode, setEditMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [pathStartNode, setPathStartNode] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  // Phase 3: Query & Filters state
  const [visibleRelationships, setVisibleRelationships] = useState<string[]>(
    Object.keys(relationshipTypes)
  );
  const [activeQuery, setActiveQuery] = useState<{
    entityType: string;
    condition: string;
    attribute: string;
  } | undefined>(undefined);
  const [queryEntityType, setQueryEntityType] = useState('');
  const [queryCondition, setQueryCondition] = useState('');
  const [queryAttribute, setQueryAttribute] = useState('');
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [loadViewDialogOpen, setLoadViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [selectedViewToLoad, setSelectedViewToLoad] = useState<SavedView | null>(null);
  const [legendCollapsed, setLegendCollapsed] = useState(false); // Expanded by default for user guidance

  // Phase 4: Gap detection state
  const [gapRules, setGapRules] = useState<GapRule[]>(defaultGapRules);
  const [gapResults, setGapResults] = useState<Map<string, GapResult>>(new Map());
  const [showGapsOnly, setShowGapsOnly] = useState(false);
  const [gapSettingsOpen, setGapSettingsOpen] = useState(false);
  const [selectedGapTemplate, setSelectedGapTemplate] = useState<string>('standard');

  // Phase 5: Impact analysis state
  const [impactMode, setImpactMode] = useState(false);
  const [impactSourceNode, setImpactSourceNode] = useState<string | null>(null);
  const [impactedNodes, setImpactedNodes] = useState<Map<string, number>>(new Map()); // nodeId -> distance
  const [impactDepth, setImpactDepth] = useState(2);
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [whatIfRemovedNode, setWhatIfRemovedNode] = useState<string | null>(null);
  const [compliancePath, setCompliancePath] = useState<string[]>([]);
  const [impactSettingsOpen, setImpactSettingsOpen] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [runEntityGraphTour, setRunEntityGraphTour] = useState(false);

  // Phase 7: Export state
  const [exportMenuAnchor, setExportMenuAnchor] = useState<HTMLElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, setCenter } = useReactFlow();
  const { focusEntity } = useEntityGraphFocus();
  const hasFocusedOnEntity = useRef(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // Reset focus flag when focus entity changes
  useEffect(() => {
    if (focusEntity) {
      hasFocusedOnEntity.current = false;
    }
  }, [focusEntity?.id]);

  // Ensure the focused entity type is visible and clear blocking filters
  useEffect(() => {
    if (focusEntity?.type) {
      const entityTypeMap: Record<string, string> = {
        model: 'models',
        vendor: 'vendors',
        risk: 'risks',
        control: 'controls',
        useCase: 'useCases',
        evidence: 'evidence',
      };
      const pluralType = entityTypeMap[focusEntity.type];
      if (pluralType) {
        // Use functional update to avoid dependency on visibleEntities
        setVisibleEntities(prev =>
          prev.includes(pluralType) ? prev : [...prev, pluralType]
        );
      }
      // Clear filters that might hide the focused entity
      setShowProblemsOnly(false);
      setShowGapsOnly(false);
      setSearchQuery('');
    }
  }, [focusEntity?.type]);

  // Focus on specific entity when provided via context (from modal)
  useEffect(() => {
    if (focusEntity && !loading && nodes.length > 0 && !hasFocusedOnEntity.current) {
      // Try exact match first, then partial match
      let targetNode = nodes.find(n => n.id === focusEntity.id);

      // If not found, try finding by starting with the entity type and ID
      if (!targetNode) {
        const idPart = focusEntity.id.split('-')[1];
        targetNode = nodes.find(n => n.id.startsWith(`${focusEntity.type}-`) && n.id.includes(idPart));
      }

      if (targetNode) {
        // Wait for layout to complete, then center on the node
        setTimeout(() => {
          setCenter(
            targetNode.position.x + 75, // Center of node (assuming ~150px width)
            targetNode.position.y + 30, // Center of node (assuming ~60px height)
            { zoom: 1.2, duration: 800 }
          );
          hasFocusedOnEntity.current = true;

          // Highlight the focused node
          setHighlightedNodeId(targetNode.id);

          // Remove highlight after 1.5 seconds
          setTimeout(() => {
            setHighlightedNodeId(null);
          }, 1500);
        }, 500);
      }
    }
  }, [focusEntity, loading, nodes, setCenter]);

  // Update nodes with highlight state
  useEffect(() => {
    if (highlightedNodeId !== null) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: node.id === highlightedNodeId,
          },
        }))
      );
    } else {
      // Clear highlight from all nodes
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: false,
          },
        }))
      );
    }
  }, [highlightedNodeId, setNodes]);

  // Reset focus flag when focusEntity changes
  useEffect(() => {
    if (!focusEntity) {
      hasFocusedOnEntity.current = false;
    }
  }, [focusEntity]);

  // Load saved views and gap rules from API (with localStorage fallback)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Phase 7: Check for shareable URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        if (viewParam) {
          try {
            const decoded = JSON.parse(atob(viewParam));
            if (decoded.ve) setVisibleEntities(decoded.ve);
            if (decoded.vr) setVisibleRelationships(decoded.vr);
            if (decoded.po !== undefined) setShowProblemsOnly(decoded.po);
            if (decoded.go !== undefined) setShowGapsOnly(decoded.go);
            if (decoded.q) {
              setActiveQuery(decoded.q);
              setQueryEntityType(decoded.q.entityType);
              setQueryCondition(decoded.q.condition);
              setQueryAttribute(decoded.q.attribute);
            }
            // Clean URL without reloading
            window.history.replaceState({}, '', window.location.pathname);
          } catch (urlErr) {
            console.error('Failed to parse view URL:', urlErr);
          }
        } else {
          // Restore last view on mount (only if no URL param)
          const lastView = localStorage.getItem(LAST_VIEW_KEY);
          if (lastView) {
            const view = JSON.parse(lastView) as SavedView;
            setVisibleEntities(view.visibleEntities);
            setVisibleRelationships(view.visibleRelationships);
            setShowProblemsOnly(view.showProblemsOnly);
            if (view.query) {
              setActiveQuery(view.query);
              setQueryEntityType(view.query.entityType);
              setQueryCondition(view.query.condition);
              setQueryAttribute(view.query.attribute);
            }
          }
        }

        // Load saved views from API
        try {
          const apiViews = await entityGraphUserData.getViews();
          if (apiViews.length > 0) {
            const mappedViews: SavedView[] = apiViews.map(v => ({
              id: String(v.id),
              name: v.name,
              visibleEntities: v.config.visibleEntities || [],
              visibleRelationships: v.config.visibleRelationships || [],
              showProblemsOnly: v.config.showProblemsOnly || false,
              query: v.config.query || undefined,
              createdAt: new Date(v.created_at || Date.now()).getTime(),
            }));
            setSavedViews(mappedViews);
          } else {
            // Fall back to localStorage
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              setSavedViews(JSON.parse(stored));
            }
          }
        } catch (apiErr) {
          console.warn('Failed to load views from API, using localStorage:', apiErr);
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setSavedViews(JSON.parse(stored));
          }
        }

        // Load gap rules from API
        try {
          const apiGapRules = await entityGraphUserData.getGapRules();
          if (apiGapRules?.rules) {
            setGapRules(apiGapRules.rules);
          } else {
            // Fall back to localStorage
            const storedGapRules = localStorage.getItem(GAP_RULES_KEY);
            if (storedGapRules) {
              setGapRules(JSON.parse(storedGapRules));
            }
          }
        } catch (apiErr) {
          console.warn('Failed to load gap rules from API, using localStorage:', apiErr);
          const storedGapRules = localStorage.getItem(GAP_RULES_KEY);
          if (storedGapRules) {
            setGapRules(JSON.parse(storedGapRules));
          }
        }
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    };

    loadUserData();
  }, []);

  // Save gap rules to localStorage and API when they change
  useEffect(() => {
    // Skip initial mount
    const isInitialMount = gapRules === defaultGapRules;
    if (isInitialMount) return;

    try {
      // Save to localStorage immediately for responsiveness
      localStorage.setItem(GAP_RULES_KEY, JSON.stringify(gapRules));

      // Sync to API in background
      entityGraphUserData.saveGapRules(gapRules).catch(err => {
        console.warn('Failed to sync gap rules to API:', err);
      });
    } catch (e) {
      console.error('Failed to save gap rules:', e);
    }
  }, [gapRules]);

  // Trigger tour after graph loads (only once)
  useEffect(() => {
    if (!loading && nodes.length > 0) {
      setRunEntityGraphTour(true);
    }
  }, [loading, nodes.length]);

  // Phase 7: Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ESC key handler to clear highlighted connections and paths
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Clear highlighted path
        if (highlightedPath.length > 0) {
          setHighlightedPath([]);
        }
        // Clear path start node
        if (pathStartNode) {
          setPathStartNode(null);
        }
        // Clear impact analysis
        if (impactSourceNode) {
          setImpactSourceNode(null);
          setImpactedNodes(new Map());
        }
        // Clear compliance path
        if (compliancePath.length > 0) {
          setCompliancePath([]);
        }
        // Close context menu
        if (contextMenu) {
          setContextMenu(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [highlightedPath, pathStartNode, impactSourceNode, compliancePath, contextMenu]);

  // Calculate gap results when data or rules change (memoized)
  const computedGapResults = useMemo(() => {
    if (!entityData) return new Map<string, GapResult>();
    return detectGaps(entityData, gapRules);
  }, [entityData, gapRules]);

  // Sync computed gap results to state for external access
  useEffect(() => {
    setGapResults(computedGapResults);
  }, [computedGapResults]);

  // Save current view state to localStorage for restoration
  useEffect(() => {
    const currentView: Partial<SavedView> = {
      visibleEntities,
      visibleRelationships,
      showProblemsOnly,
      query: activeQuery,
    };
    try {
      localStorage.setItem(LAST_VIEW_KEY, JSON.stringify(currentView));
    } catch (e) {
      console.error('Failed to save last view:', e);
    }
  }, [visibleEntities, visibleRelationships, showProblemsOnly, activeQuery]);

  // Fetch data on mount with progress tracking
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
  // Phase 7: Uses debouncedSearchQuery for performance
  useEffect(() => {
    if (!entityData) {
      return;
    }

    const { nodes: newNodes, edges: newEdges, entityLookup: newLookup } = generateNodesAndEdges(
      entityData,
      {
        visibleEntities,
        showProblemsOnly,
        searchQuery: debouncedSearchQuery, // Phase 7: Use debounced value
        visibleRelationships,
        activeQuery,
        gapResults,
        showGapsOnly
      }
    );
    setNodes(newNodes);
    setEdges(newEdges);
    setEntityLookup(newLookup);

    // Fit view after updating nodes with smooth animation
    const timeoutId = setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);

    // Cleanup timeout on unmount or re-render
    return () => clearTimeout(timeoutId);
  }, [entityData, visibleEntities, showProblemsOnly, debouncedSearchQuery, visibleRelationships, activeQuery, gapResults, showGapsOnly, setNodes, setEdges, fitView]);

  const handleVisibilityChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newVisibility: string[]) => {
      if (newVisibility.length > 0) {
        setVisibleEntities(newVisibility);
      }
    },
    []
  );

  // Handle node click with modifier support
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as ExtendedNodeData;

      // Ctrl+click: Path highlighting
      if (event.ctrlKey || event.metaKey) {
        if (pathStartNode === node.id) {
          // Ctrl+click same node again - clear path highlighting
          setPathStartNode(null);
          setHighlightedPath([]);
        } else if (pathStartNode) {
          // Find and highlight path between pathStartNode and this node
          const path = findShortestPath(pathStartNode, node.id, edges);
          setHighlightedPath(path);
          setPathStartNode(null);
        } else {
          // Set this as the start node for path
          setPathStartNode(node.id);
          setHighlightedPath([node.id]);
        }
        return;
      }

      // Shift+click: Multi-select
      if (event.shiftKey) {
        setSelectedNodes(prev => {
          const newSet = new Set(prev);
          if (newSet.has(node.id)) {
            newSet.delete(node.id);
          } else {
            newSet.add(node.id);
          }
          return newSet;
        });
        return;
      }

      // Clear path and multi-select on regular click
      setHighlightedPath([]);
      setPathStartNode(null);
      setSelectedNodes(new Set());

      // Phase 5: Handle impact analysis mode (inline logic)
      if (impactMode) {
        if (impactSourceNode === node.id) {
          setImpactSourceNode(null);
          setImpactedNodes(new Map());
          setCompliancePath([]);
        } else {
          setImpactSourceNode(node.id);
          const impacted = getNodesWithinDepth(node.id, edges, impactDepth);
          const impactMap = new Map<string, number>();
          impacted.forEach(({ nodeId: id, distance }) => {
            impactMap.set(id, distance);
          });
          setImpactedNodes(impactMap);
          // Calculate compliance path if starting from a model or control
          if (node.id.startsWith('model-') || node.id.startsWith('control-')) {
            const { path } = getCompliancePath(node.id, edges);
            setCompliancePath(path);
          } else {
            setCompliancePath([]);
          }
        }
        return;
      }

      // Phase 5: Handle what-if simulation mode (inline logic)
      if (whatIfMode) {
        if (whatIfRemovedNode === node.id) {
          setWhatIfRemovedNode(null);
          setImpactedNodes(new Map());
        } else {
          setWhatIfRemovedNode(node.id);
          const impacted = getNodesWithinDepth(node.id, edges, impactDepth);
          const impactMap = new Map<string, number>();
          impacted.forEach(({ nodeId: id, distance }) => {
            if (id !== node.id) {
              impactMap.set(id, distance);
            }
          });
          setImpactedNodes(impactMap);
        }
        return;
      }

      // Open sidebar with entity details
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
    [edges, entityLookup, pathStartNode, impactMode, whatIfMode, impactSourceNode, whatIfRemovedNode, impactDepth]
  );

  // Handle right-click context menu
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const nodeData = node.data as ExtendedNodeData;
      setContextMenu({
        mouseX: event.clientX,
        mouseY: event.clientY,
        nodeId: node.id,
        nodeData,
      });
    },
    []
  );

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Context menu actions
  const handleViewDetails = useCallback(() => {
    if (contextMenu) {
      const node = nodes.find(n => n.id === contextMenu.nodeId);
      if (node) {
        handleNodeClick({ ctrlKey: false, shiftKey: false, metaKey: false } as React.MouseEvent, node);
      }
    }
    setContextMenu(null);
  }, [contextMenu, nodes, handleNodeClick]);

  const handleShowConnections = useCallback(() => {
    if (contextMenu) {
      // Highlight all edges connected to this node
      const connectedNodeIds = new Set<string>();
      connectedNodeIds.add(contextMenu.nodeId);
      edges.forEach(edge => {
        if (edge.source === contextMenu.nodeId) {
          connectedNodeIds.add(edge.target);
        } else if (edge.target === contextMenu.nodeId) {
          connectedNodeIds.add(edge.source);
        }
      });
      setHighlightedPath(Array.from(connectedNodeIds));
    }
    setContextMenu(null);
  }, [contextMenu, edges]);

  // Clear path highlighting
  const handleClearPath = useCallback(() => {
    setHighlightedPath([]);
    setPathStartNode(null);
  }, []);

  // Clear multi-selection
  const handleClearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  // Handle selection change from ReactFlow (for lasso selection)
  const handleSelectionChange = useCallback(({ nodes: selectedFlowNodes }: { nodes: Node[] }) => {
    setSelectedNodes(new Set(selectedFlowNodes.map(n => n.id)));
  }, []);

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

  // Phase 3: Query handlers
  const handleApplyQuery = useCallback(() => {
    if (queryEntityType && queryCondition && queryAttribute) {
      setActiveQuery({ entityType: queryEntityType, condition: queryCondition, attribute: queryAttribute });
    }
  }, [queryEntityType, queryCondition, queryAttribute]);

  const handleClearQuery = useCallback(() => {
    setActiveQuery(undefined);
    setQueryEntityType('');
    setQueryCondition('');
    setQueryAttribute('');
  }, []);

  // Phase 3: Saved views handlers
  const handleSaveView = useCallback(async () => {
    if (!newViewName.trim()) return;

    const config: entityGraphUserData.EntityGraphViewConfig = {
      visibleEntities,
      visibleRelationships,
      showProblemsOnly,
      query: activeQuery || null,
    };

    try {
      // Try to save to API first
      const savedView = await entityGraphUserData.createView(newViewName.trim(), config);
      const mappedView: SavedView = {
        id: String(savedView.id),
        name: savedView.name,
        visibleEntities: savedView.config.visibleEntities || [],
        visibleRelationships: savedView.config.visibleRelationships || [],
        showProblemsOnly: savedView.config.showProblemsOnly || false,
        query: savedView.config.query || undefined,
        createdAt: new Date(savedView.created_at || Date.now()).getTime(),
      };
      setSavedViews(prev => [...prev, mappedView]);
    } catch (e) {
      console.warn('Failed to save view to API, using localStorage:', e);
      // Fall back to localStorage
      const newView: SavedView = {
        id: `view-${Date.now()}`,
        name: newViewName.trim(),
        visibleEntities,
        visibleRelationships,
        showProblemsOnly,
        query: activeQuery,
        createdAt: Date.now(),
      };
      const updatedViews = [...savedViews, newView];
      setSavedViews(updatedViews);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedViews));
      } catch (storageErr) {
        console.error('Failed to save view to localStorage:', storageErr);
      }
    }
    setNewViewName('');
    setSaveViewDialogOpen(false);
  }, [newViewName, visibleEntities, visibleRelationships, showProblemsOnly, activeQuery, savedViews]);

  const handleLoadView = useCallback((view: SavedView) => {
    setVisibleEntities(view.visibleEntities);
    setVisibleRelationships(view.visibleRelationships);
    setShowProblemsOnly(view.showProblemsOnly);
    if (view.query) {
      setActiveQuery(view.query);
      setQueryEntityType(view.query.entityType);
      setQueryCondition(view.query.condition);
      setQueryAttribute(view.query.attribute);
    } else {
      handleClearQuery();
    }
    setLoadViewDialogOpen(false);
  }, [handleClearQuery]);

  const handleDeleteView = useCallback(async (viewId: string) => {
    // Update local state immediately for responsiveness
    setSavedViews(prev => prev.filter(v => v.id !== viewId));

    // Try to delete from API if it's a numeric ID (from database)
    const numericId = parseInt(viewId, 10);
    if (!isNaN(numericId)) {
      try {
        await entityGraphUserData.deleteView(numericId);
      } catch (e) {
        console.warn('Failed to delete view from API:', e);
      }
    }

    // Also update localStorage for fallback views
    try {
      const updatedViews = savedViews.filter(v => v.id !== viewId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedViews));
    } catch (e) {
      console.error('Failed to update localStorage:', e);
    }
  }, [savedViews]);

  // Phase 4: Gap detection handlers
  const handleApplyGapTemplate = useCallback((templateKey: string) => {
    const template = gapTemplates[templateKey as keyof typeof gapTemplates];
    if (template) {
      setGapRules(template.rules);
      setSelectedGapTemplate(templateKey);
    }
  }, []);

  // Phase 5: Impact analysis handlers
  const handleImpactAnalysis = useCallback((nodeId: string) => {
    // Note: We don't check impactMode here because this is also called from context menu
    if (impactSourceNode === nodeId) {
      // Clicking same node clears impact
      setImpactSourceNode(null);
      setImpactedNodes(new Map());
      setCompliancePath([]);
      return;
    }

    setImpactSourceNode(nodeId);
    const impacted = getNodesWithinDepth(nodeId, edges, impactDepth);
    const impactMap = new Map<string, number>();
    impacted.forEach(({ nodeId: id, distance }) => {
      impactMap.set(id, distance);
    });
    setImpactedNodes(impactMap);

    // Also calculate compliance path if starting from a model
    if (nodeId.startsWith('model-') || nodeId.startsWith('control-')) {
      const { path } = getCompliancePath(nodeId, edges);
      setCompliancePath(path);
    } else {
      setCompliancePath([]);
    }
  }, [impactSourceNode, edges, impactDepth]);

  const handleClearImpact = useCallback(() => {
    setImpactSourceNode(null);
    setImpactedNodes(new Map());
    setWhatIfRemovedNode(null);
    setCompliancePath([]);
  }, []);

  const handleShowCompliancePath = useCallback((nodeId: string) => {
    const { path } = getCompliancePath(nodeId, edges);
    if (path.length > 1) {
      setCompliancePath(path);
      setHighlightedPath(path);
    }
  }, [edges]);

  // Phase 7: Export handlers
  const handleExportPNG = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    setExporting(true);
    setExportMenuAnchor(null);

    try {
      // Find the ReactFlow viewport element
      const viewport = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewport) throw new Error('Could not find graph viewport');

      const canvas = await html2canvas(viewport, {
        backgroundColor: '#f9fafb',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `entity-graph-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setExporting(false);
    }
  }, []);

  const handleExportJSON = useCallback(() => {
    if (!entityData) return;
    setExportMenuAnchor(null);

    // Create comprehensive export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      graph: {
        nodes: nodes.map(n => ({
          id: n.id,
          type: (n.data as ExtendedNodeData).entityType,
          label: (n.data as ExtendedNodeData).label,
          position: n.position,
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
        })),
      },
      entities: {
        useCases: entityData.useCases,
        models: entityData.models,
        risks: entityData.risks,
        vendors: entityData.vendors,
        controls: entityData.controls,
        evidence: entityData.evidence,
        frameworks: entityData.frameworks,
      },
      viewState: {
        visibleEntities,
        visibleRelationships,
        showProblemsOnly,
        activeQuery,
        gapRules,
      },
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `entity-graph-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [entityData, nodes, edges, visibleEntities, visibleRelationships, showProblemsOnly, activeQuery, gapRules]);

  // Entity counts for legend
  const entityCounts = useMemo(() => {
    if (!entityData) return null;
    return {
      useCases: entityData.useCases.filter(p => !(p as { is_organizational?: boolean }).is_organizational).length,
      models: entityData.models.length,
      risks: entityData.risks.length,
      vendors: entityData.vendors.length,
      controls: entityData.controls.length,
      evidence: entityData.evidence.length,
      frameworks: entityData.frameworks.length,
    };
  }, [entityData]);

  // Problem counts (high-risk items)
  const problemCounts = useMemo(() => {
    if (!entityData) return { total: 0, high: 0 };
    let high = 0;
    entityData.risks.forEach(r => {
      if (riskPriority[r.risk_level] >= 3) high++;
    });
    return { total: high, high };
  }, [entityData]);

  // Gap counts for summary
  const gapCounts = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let info = 0;
    gapResults.forEach(result => {
      if (result.highestSeverity === 'critical') critical++;
      else if (result.highestSeverity === 'warning') warning++;
      else info++;
    });
    return { total: gapResults.size, critical, warning, info };
  }, [gapResults]);

  // Apply highlighting styles to nodes
  const styledNodes = useMemo(() => {
    return nodes.map(node => {
      const isHighlighted = highlightedPath.includes(node.id);
      const isSelected = selectedNodes.has(node.id);
      const isPathStart = node.id === pathStartNode;

      // Phase 5: Impact analysis styling
      const isImpactSource = node.id === impactSourceNode;
      const impactDistance = impactedNodes.get(node.id);
      const isImpacted = impactDistance !== undefined;
      const isOnCompliancePath = compliancePath.includes(node.id);
      const isWhatIfRemoved = node.id === whatIfRemovedNode;

      // Determine impact color based on distance
      const getImpactFilter = () => {
        if (isImpactSource) return 'drop-shadow(0 0 12px #13715B)';
        if (isWhatIfRemoved) return 'drop-shadow(0 0 12px #dc2626) grayscale(0.8)';
        if (isImpacted && impactDistance !== undefined) {
          const color = impactDepthColors[Math.min(impactDistance, 4)] || '#f97316';
          return `drop-shadow(0 0 8px ${color})`;
        }
        if (isOnCompliancePath) return 'drop-shadow(0 0 8px #8b5cf6)';
        if (isSelected) return 'drop-shadow(0 0 8px #13715B)';
        return undefined;
      };

      // Determine opacity
      const getOpacity = () => {
        // If we're in impact mode with active analysis, fade non-impacted nodes
        // But keep the source node and what-if removed node visible
        if ((impactMode || whatIfMode) && impactedNodes.size > 0 && !isImpacted && !isImpactSource && !isWhatIfRemoved) {
          return 0.2;
        }
        // If we have highlighted path, fade non-highlighted nodes
        if (highlightedPath.length > 0 && !isHighlighted) {
          return 0.3;
        }
        return 1;
      };

      return {
        ...node,
        style: {
          ...node.style,
          opacity: getOpacity(),
          filter: getImpactFilter(),
          outline: isPathStart ? '3px dashed #13715B' : isOnCompliancePath ? '2px solid #8b5cf6' : undefined,
          outlineOffset: '4px',
        },
        selected: isSelected,
        draggable: editMode,
      };
    });
  }, [nodes, highlightedPath, selectedNodes, pathStartNode, editMode, impactSourceNode, impactedNodes, compliancePath, whatIfRemovedNode, impactMode, whatIfMode]);

  // Apply highlighting styles to edges
  const styledEdges = useMemo(() => {
    const pathEdgeIds = new Set<string>();
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      const source = highlightedPath[i];
      const target = highlightedPath[i + 1];
      // Check both directions
      pathEdgeIds.add(`${source}-${target}`);
      pathEdgeIds.add(`${target}-${source}`);
    }

    // Phase 5: Build set of compliance path edges
    const complianceEdgeIds = new Set<string>();
    for (let i = 0; i < compliancePath.length - 1; i++) {
      const source = compliancePath[i];
      const target = compliancePath[i + 1];
      complianceEdgeIds.add(`${source}-${target}`);
      complianceEdgeIds.add(`${target}-${source}`);
    }

    return edges.map(edge => {
      const edgeKey1 = `${edge.source}-${edge.target}`;
      const edgeKey2 = `${edge.target}-${edge.source}`;
      const isOnPath = pathEdgeIds.has(edgeKey1) || pathEdgeIds.has(edgeKey2);
      const isConnectedToHighlighted = highlightedPath.includes(edge.source) && highlightedPath.includes(edge.target);

      // Phase 5: Check if edge is part of impact or compliance path
      const isOnCompliancePath = complianceEdgeIds.has(edgeKey1) || complianceEdgeIds.has(edgeKey2);
      const isImpactEdge = impactedNodes.has(edge.source) && impactedNodes.has(edge.target);

      // Determine edge styling based on current mode
      const getEdgeOpacity = () => {
        if ((impactMode || whatIfMode) && impactedNodes.size > 0) {
          return isImpactEdge || isOnCompliancePath ? 1 : 0.1;
        }
        if (highlightedPath.length > 0) {
          return isConnectedToHighlighted ? 1 : 0.15;
        }
        return 1;
      };

      const getEdgeStroke = () => {
        if (isOnCompliancePath) return '#8b5cf6';
        if (isOnPath) return '#13715B';
        return edge.style?.stroke;
      };

      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: getEdgeOpacity(),
          strokeWidth: isOnPath || isOnCompliancePath ? 3 : edge.style?.strokeWidth || 1.5,
          stroke: getEdgeStroke(),
        },
        animated: isOnPath || isOnCompliancePath,
      };
    });
  }, [edges, highlightedPath, compliancePath, impactedNodes, impactMode, whatIfMode]);

  // Loading state with progress bar
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

  // Empty state when no entities exist
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
            variant="contained"
            size="small"
            href="/model-inventory"
            sx={{
              textTransform: 'none',
              backgroundColor: '#13715B',
              '&:hover': { backgroundColor: '#0f5a48' },
            }}
          >
            Add model
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box ref={reactFlowWrapper} sx={{ width: '100%', height: 'calc(100vh - 64px)', position: 'relative' }}>
      {/* Alert component for toast messages */}
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          body={alert.body}
          isToast
          onClick={() => setAlert(null)}
        />
      )}

      {/* Page tour for first-time users */}
      <PageTour
        steps={EntityGraphSteps}
        run={runEntityGraphTour}
        onFinish={() => {
          localStorage.setItem(TOUR_KEY, 'true');
          setRunEntityGraphTour(false);
        }}
        tourKey={TOUR_KEY}
      />

      <ReactFlow
        data-joyride-id="entity-graph-canvas"
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={editMode}
        nodesConnectable={editMode}
        elementsSelectable={true}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={true}
        panOnDrag={!editMode}
        zoomOnScroll={true}
        defaultEdgeOptions={{
          style: { strokeWidth: 1.5 },
          animated: false,
        }}
      >
        <Controls />
        <MiniMap
          nodeStrokeColor={(node) => (node.data as { color?: string })?.color || '#888'}
          nodeColor={(node) => (node.data as { color?: string })?.color || '#fff'}
          nodeBorderRadius={4}
          pannable
          zoomable
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e0e0e0" />

        {/* Search and Filter Panel */}
        <Panel position="top-left">
          <Box sx={{
            backgroundColor: 'white',
            p: 2,
            borderRadius: '4px',
            border: '1px solid #d0d5dd',
            width: 250,
          }}>
            {/* Search */}
            <Box data-joyride-id="entity-search">
              <SearchBox
                placeholder="Search entities..."
                value={searchQuery}
                onChange={setSearchQuery}
                sx={{ mb: 1.5 }}
              />
            </Box>

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
                    label={String(problemCounts.high)}
                    sx={{
                      height: 18,
                      fontSize: 10,
                      backgroundColor: '#dc2626',
                      color: 'white'
                    }}
                  />
                )}
              </Box>
              <Toggle
                size="small"
                checked={showProblemsOnly}
                onChange={(e) => setShowProblemsOnly(e.target.checked)}
              />
            </Box>

            {/* Entity visibility with colored indicators (serves as legend) - 2 column grid */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: 12 }}>
              Entity visibility
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, padding: '1px', overflow: 'visible' }}>
              <ToggleButtonGroup
                value={visibleEntities}
                onChange={handleVisibilityChange}
                aria-label="entity visibility"
                size="small"
                sx={{ display: 'contents' }}
              >
                {/* Row 1 */}
                <ToggleButton
                  value="useCases"
                  sx={{
                    fontSize: 10,
                    py: 0.5,
                    justifyContent: 'flex-start',
                    '&.Mui-selected': { backgroundColor: `${entityColors.useCase}20`, borderColor: entityColors.useCase },
                    '&.Mui-selected:hover': { backgroundColor: `${entityColors.useCase}30` },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.useCase, mr: 0.5, flexShrink: 0 }} />
                  Use cases ({entityCounts?.useCases || 0})
                </ToggleButton>
                <ToggleButton
                  value="models"
                  sx={{
                    fontSize: 10,
                    py: 0.5,
                    justifyContent: 'flex-start',
                    '&.Mui-selected': { backgroundColor: `${entityColors.model}20`, borderColor: entityColors.model },
                    '&.Mui-selected:hover': { backgroundColor: `${entityColors.model}30` },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.model, mr: 0.5, flexShrink: 0 }} />
                  Models ({entityCounts?.models || 0})
                </ToggleButton>
                {/* Row 2 */}
                <ToggleButton
                  value="vendors"
                  sx={{
                    fontSize: 10,
                    py: 0.5,
                    justifyContent: 'flex-start',
                    '&.Mui-selected': { backgroundColor: `${entityColors.vendor}20`, borderColor: entityColors.vendor },
                    '&.Mui-selected:hover': { backgroundColor: `${entityColors.vendor}30` },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.vendor, mr: 0.5, flexShrink: 0 }} />
                  Vendors ({entityCounts?.vendors || 0})
                </ToggleButton>
                <ToggleButton
                  value="risks"
                  sx={{
                    fontSize: 10,
                    py: 0.5,
                    justifyContent: 'flex-start',
                    '&.Mui-selected': { backgroundColor: `${entityColors.risk}20`, borderColor: entityColors.risk },
                    '&.Mui-selected:hover': { backgroundColor: `${entityColors.risk}30` },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.risk, mr: 0.5, flexShrink: 0 }} />
                  Risks ({entityCounts?.risks || 0})
                </ToggleButton>
                {/* Row 3 */}
                <ToggleButton
                  value="controls"
                  sx={{
                    fontSize: 10,
                    py: 0.5,
                    justifyContent: 'flex-start',
                    '&.Mui-selected': { backgroundColor: `${entityColors.control}20`, borderColor: entityColors.control },
                    '&.Mui-selected:hover': { backgroundColor: `${entityColors.control}30` },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.control, mr: 0.5, flexShrink: 0 }} />
                  Controls ({entityCounts?.controls || 0})
                </ToggleButton>
                <ToggleButton
                  value="evidence"
                  sx={{
                    fontSize: 10,
                    py: 0.5,
                    justifyContent: 'flex-start',
                    '&.Mui-selected': { backgroundColor: `${entityColors.evidence}20`, borderColor: entityColors.evidence },
                    '&.Mui-selected:hover': { backgroundColor: `${entityColors.evidence}30` },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.evidence, mr: 0.5, flexShrink: 0 }} />
                  Evidence ({entityCounts?.evidence || 0})
                </ToggleButton>
                {/* Row 4 */}
                <ToggleButton
                  value="frameworks"
                  sx={{
                    fontSize: 10,
                    py: 0.5,
                    justifyContent: 'flex-start',
                    gridColumn: 'span 2',
                    '&.Mui-selected': { backgroundColor: `${entityColors.framework}20`, borderColor: entityColors.framework },
                    '&.Mui-selected:hover': { backgroundColor: `${entityColors.framework}30` },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entityColors.framework, mr: 0.5, flexShrink: 0 }} />
                  Frameworks ({entityCounts?.frameworks || 0})
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Edit mode toggle */}
            <Button
              variant={editMode ? 'contained' : 'outlined'}
              size="small"
              fullWidth
              startIcon={editMode ? <Eye size={14} /> : <Edit3 size={14} />}
              onClick={() => setEditMode(!editMode)}
              sx={{
                textTransform: 'none',
                height: 34,
                fontSize: 12,
                backgroundColor: editMode ? '#13715B' : 'transparent',
                borderColor: '#d0d5dd',
                color: editMode ? 'white' : '#344054',
                '&:hover': {
                  backgroundColor: editMode ? '#0f5a48' : '#f9fafb',
                  borderColor: '#9ca3af',
                },
              }}
            >
              {editMode ? 'Exit edit mode' : 'Edit mode'}
            </Button>

            {/* Phase 4: Gap Detection Section */}
            <Accordion
              data-joyride-id="gap-detection"
              expanded={gapSettingsOpen}
              onChange={() => setGapSettingsOpen(!gapSettingsOpen)}
              disableGutters
              sx={{
                border: `1px solid ${gapCounts.critical > 0 ? '#fecaca' : '#d0d5dd'}`,
                borderRadius: '4px !important',
                boxShadow: 'none',
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={<ChevronDown size={14} color="#667085" />}
                sx={{
                  minHeight: 40,
                  backgroundColor: gapCounts.total > 0 ? '#fef2f2' : '#f9fafb',
                  '&:hover': { backgroundColor: gapCounts.total > 0 ? '#fee2e2' : '#f3f4f6' },
                  '& .MuiAccordionSummary-content': { margin: '8px 0' },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    transform: gapSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AlertCircle size={14} color={gapCounts.critical > 0 ? '#dc2626' : '#667085'} />
                  <Typography sx={{ fontSize: 12, color: '#344054', fontWeight: 500 }}>
                    Gap detection
                  </Typography>
                  <VWTooltip
                    content="Identifies entities with missing or incomplete data, such as models without risk assessments, controls without evidence, or vendors without owners."
                    placement="top"
                    maxWidth={220}
                  >
                    <Info size={12} color="#9CA3AF" style={{ cursor: 'help' }} />
                  </VWTooltip>
                  {gapCounts.total > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {gapCounts.critical > 0 && (
                        <Chip size="small" label={String(gapCounts.critical)} sx={{ height: 18, fontSize: 10, backgroundColor: '#dc2626', color: 'white' }} />
                      )}
                      {gapCounts.warning > 0 && (
                        <Chip size="small" label={String(gapCounts.warning)} sx={{ height: 18, fontSize: 10, backgroundColor: '#f59e0b', color: 'white' }} />
                      )}
                    </Box>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, backgroundColor: '#f9fafb' }}>
                {/* Show gaps only toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Eye size={14} color="#667085" />
                    <Typography sx={{ fontSize: 11, color: '#344054' }}>Show gaps only</Typography>
                  </Box>
                  <Toggle
                    size="small"
                    checked={showGapsOnly}
                    onChange={(e) => setShowGapsOnly(e.target.checked)}
                  />
                </Box>

                {/* Gap template selector */}
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#344054', mb: 0.5 }}>
                  Detection template
                </Typography>
                <Box sx={{ display: 'flex', gap: '4px', mb: 1.5 }}>
                  {Object.entries(gapTemplates).map(([key, template]) => (
                    <VWTooltip key={key} content={template.description}>
                      <Chip
                        size="small"
                        label={template.name.split(' ')[0]}
                        onClick={() => handleApplyGapTemplate(key)}
                        sx={{
                          fontSize: 10,
                          height: 22,
                          borderRadius: '4px',
                          backgroundColor: selectedGapTemplate === key ? '#13715B' : '#e5e7eb',
                          color: selectedGapTemplate === key ? 'white' : '#344054',
                          cursor: 'pointer',
                          '& .MuiChip-label': { px: '4px' },
                          '&:hover': { backgroundColor: selectedGapTemplate === key ? '#0f5a48' : '#d1d5db' },
                        }}
                      />
                    </VWTooltip>
                  ))}
                </Box>

                {/* Gap summary */}
                {gapCounts.total > 0 && (
                  <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #e5e7eb' }}>
                    <Typography sx={{ fontSize: 10, color: '#667085', mb: 0.5 }}>
                      Detected gaps: {gapCounts.total} entities
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {gapCounts.critical > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626' }} />
                          <Typography sx={{ fontSize: 10, color: '#dc2626' }}>{gapCounts.critical} critical</Typography>
                        </Box>
                      )}
                      {gapCounts.warning > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                          <Typography sx={{ fontSize: 10, color: '#f59e0b' }}>{gapCounts.warning} warning</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Phase 5: Impact Analysis Section */}
            <Accordion
              data-joyride-id="impact-analysis"
              expanded={impactSettingsOpen}
              onChange={() => setImpactSettingsOpen(!impactSettingsOpen)}
              disableGutters
              sx={{
                border: `1px solid ${impactMode || whatIfMode ? '#bfdbfe' : '#d0d5dd'}`,
                borderRadius: '4px !important',
                boxShadow: 'none',
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={<ChevronDown size={14} color="#667085" />}
                sx={{
                  minHeight: 40,
                  backgroundColor: impactMode || whatIfMode ? '#eff6ff' : '#f9fafb',
                  '&:hover': { backgroundColor: impactMode || whatIfMode ? '#dbeafe' : '#f3f4f6' },
                  '& .MuiAccordionSummary-content': { margin: '8px 0' },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    transform: impactSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Zap size={14} color={impactMode ? '#3b82f6' : '#667085'} />
                  <Typography sx={{ fontSize: 12, color: '#344054', fontWeight: 500 }}>
                    Impact analysis
                  </Typography>
                  {impactedNodes.size > 0 && (
                    <Chip
                      size="small"
                      label={String(impactedNodes.size)}
                      sx={{ height: 18, fontSize: 10, backgroundColor: '#3b82f6', color: 'white' }}
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, backgroundColor: '#f9fafb' }}>
                {/* Impact mode toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Target size={14} color="#667085" />
                    <Typography sx={{ fontSize: 11, color: '#344054' }}>Click for impact</Typography>
                    <VWTooltip
                      content="When enabled, clicking any entity shows all connected entities that would be affected if it changes. Highlights nodes by distance from the source."
                      placement="top"
                      maxWidth={220}
                    >
                      <Info size={12} color="#9CA3AF" style={{ cursor: 'help' }} />
                    </VWTooltip>
                  </Box>
                  <Toggle
                    size="small"
                    checked={impactMode}
                    onChange={(e) => {
                      setImpactMode(e.target.checked);
                      if (!e.target.checked) handleClearImpact();
                      if (e.target.checked) setWhatIfMode(false);
                    }}
                  />
                </Box>

                {/* What-if simulation toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Trash2 size={14} color="#667085" />
                    <Typography sx={{ fontSize: 11, color: '#344054' }}>What-if simulation</Typography>
                    <VWTooltip
                      content="Simulates removing an entity to visualize the cascading impact on connected entities. Shows which models, risks, controls, and evidence would be affected if you delete or decommission an entity. Useful for change impact assessment and risk planning."
                      placement="top"
                      maxWidth={280}
                    >
                      <Info size={12} color="#9CA3AF" style={{ cursor: 'help' }} />
                    </VWTooltip>
                  </Box>
                  <Toggle
                    size="small"
                    checked={whatIfMode}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setWhatIfMode(enabled);
                      if (!enabled) handleClearImpact();
                      if (enabled) {
                        setImpactMode(false);
                        handleAlert({
                          variant: 'info',
                          title: 'What-if simulation enabled',
                          body: 'Click on any entity to simulate its removal and see which entities would be affected.',
                          setAlert,
                        });
                      }
                    }}
                  />
                </Box>

                {/* Propagation depth */}
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#344054', mb: 0.5 }}>
                  Propagation depth
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
                  {[1, 2, 3, 4].map((depth) => (
                    <Chip
                      key={depth}
                      size="small"
                      label={`${depth} hop${depth > 1 ? 's' : ''}`}
                      onClick={() => setImpactDepth(depth)}
                      sx={{
                        fontSize: 10,
                        height: 22,
                        borderRadius: '4px',
                        backgroundColor: impactDepth === depth ? '#3b82f6' : '#e5e7eb',
                        color: impactDepth === depth ? 'white' : '#344054',
                        cursor: 'pointer',
                        '& .MuiChip-label': { px: '4px' },
                        '&:hover': { backgroundColor: impactDepth === depth ? '#2563eb' : '#d1d5db' },
                      }}
                    />
                  ))}
                </Box>

                {/* Impact depth legend */}
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#344054', mb: 0.5 }}>
                  Impact distance
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Object.entries(impactDepthColors).slice(0, impactDepth + 1).map(([dist, color]) => (
                    <Chip
                      key={dist}
                      size="small"
                      label={dist === '0' ? 'Source' : `${dist} hop${Number(dist) > 1 ? 's' : ''}`}
                      sx={{
                        height: 20,
                        fontSize: 9,
                        backgroundColor: color,
                        color: 'white',
                        borderRadius: '4px',
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  ))}
                </Box>

                {/* Clear impact button */}
                {(impactedNodes.size > 0 || compliancePath.length > 0) && (
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={handleClearImpact}
                    startIcon={<X size={12} />}
                    sx={{
                      mt: 1.5,
                      textTransform: 'none',
                      height: 28,
                      fontSize: 11,
                      borderColor: '#d0d5dd',
                      color: '#344054',
                      '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                    }}
                  >
                    Clear impact analysis
                  </Button>
                )}

                {/* Active impact info */}
                {impactSourceNode && (
                  <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #e5e7eb' }}>
                    <Typography sx={{ fontSize: 10, color: '#667085' }}>
                      Analyzing: {impactSourceNode.split('-')[0]} #{impactSourceNode.split('-')[1]}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: '#3b82f6' }}>
                      {impactedNodes.size} entities within {impactDepth} hops
                    </Typography>
                  </Box>
                )}

                {whatIfRemovedNode && (
                  <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #e5e7eb' }}>
                    <Typography sx={{ fontSize: 10, color: '#dc2626', fontWeight: 500 }}>
                      Simulating removal of: {whatIfRemovedNode.split('-')[0]} #{whatIfRemovedNode.split('-')[1]}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: '#667085' }}>
                      {impactedNodes.size} entities would be affected
                    </Typography>
                  </Box>
                )}

                {compliancePath.length > 1 && (
                  <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #e5e7eb' }}>
                    <Typography sx={{ fontSize: 10, color: '#8b5cf6', fontWeight: 500 }}>
                      Compliance path: {compliancePath.length} entities
                    </Typography>
                    <Typography sx={{ fontSize: 9, color: '#667085' }}>
                      {compliancePath.map(id => id.split('-')[0]).join(' → ')}
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Phase 3: Save/Load views - moved to bottom */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
              <VWTooltip content="Save current view">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSaveViewDialogOpen(true)}
                  sx={{
                    flex: 1,
                    textTransform: 'none',
                    height: 34,
                    fontSize: 11,
                    borderColor: '#d0d5dd',
                    color: '#344054',
                    '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                  }}
                >
                  <Save size={14} style={{ marginRight: 4 }} />
                  Save
                </Button>
              </VWTooltip>
              <VWTooltip content="Load saved view">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setLoadViewDialogOpen(true)}
                  disabled={savedViews.length === 0}
                  sx={{
                    flex: 1,
                    textTransform: 'none',
                    height: 34,
                    fontSize: 11,
                    borderColor: '#d0d5dd',
                    color: '#344054',
                    '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                  }}
                >
                  <FolderOpen size={14} style={{ marginRight: 4 }} />
                  Load ({savedViews.length})
                </Button>
              </VWTooltip>
            </Box>

            {/* Phase 7: Export - moved to bottom */}
            <VWTooltip content="Export graph">
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={exporting || !entityData}
                sx={{
                  textTransform: 'none',
                  height: 34,
                  fontSize: 11,
                  borderColor: '#d0d5dd',
                  color: '#344054',
                  justifyContent: 'space-between',
                  '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Download size={14} style={{ marginRight: 4 }} />
                  {exporting ? 'Exporting...' : 'Export'}
                </Box>
                <ChevronDown size={14} />
              </Button>
            </VWTooltip>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={() => setExportMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              sx={{ '& .MuiPaper-root': { minWidth: 180, mt: 0.5 } }}
            >
              <MenuItem onClick={handleExportPNG} sx={{ fontSize: 13 }}>
                <FileImage size={14} style={{ marginRight: 8 }} />
                Export as PNG
              </MenuItem>
              <MenuItem onClick={handleExportJSON} sx={{ fontSize: 13 }}>
                <FileJson size={14} style={{ marginRight: 8 }} />
                Export as JSON
              </MenuItem>
            </Menu>

            {/* Shortcuts section - moved to bottom of left panel */}
            <Accordion
              expanded={!legendCollapsed}
              onChange={() => setLegendCollapsed(!legendCollapsed)}
              disableGutters
              sx={{
                border: '1px solid #d0d5dd',
                borderRadius: '4px !important',
                boxShadow: 'none',
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={<ChevronDown size={14} color="#667085" />}
                sx={{
                  minHeight: 36,
                  backgroundColor: '#f9fafb',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                  '& .MuiAccordionSummary-content': { margin: '6px 0' },
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    transform: !legendCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info size={14} color="#667085" />
                  <Typography sx={{ fontSize: 12, color: '#344054', fontWeight: 500 }}>
                    Shortcuts
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, backgroundColor: '#f9fafb' }}>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontSize: 11, color: '#667085' }}>
                    <b>Click</b> - View details
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#667085' }}>
                    <b>Right-click</b> - Context menu
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#667085' }}>
                    <b>Ctrl+click</b> - Find path
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#667085' }}>
                    <b>Shift+click</b> - Multi-select
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Panel>

        {/* Phase 3: Smart Query Builder Panel */}
        <Panel position="top-center">
          <Box sx={{
            backgroundColor: 'white',
            p: 1.5,
            borderRadius: '4px',
            border: '1px solid #d0d5dd',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
            <Sparkles size={16} color="#13715B" />
            <Typography sx={{ fontSize: 12, color: '#667085', whiteSpace: 'nowrap', mr: '8px' }}>Show me</Typography>
            <VWSelect
              id="query-entity-type"
              value={queryEntityType}
              onChange={(e) => {
                setQueryEntityType(e.target.value as string);
                setQueryCondition('');
                setQueryAttribute('');
              }}
              placeholder="Entity type"
              items={queryEntityTypes.map(et => ({ _id: et.value, name: et.label }))}
              sx={{ minWidth: 120, '& .select-component': { height: 30, fontSize: 12 } }}
            />
            <VWSelect
              id="query-condition"
              value={queryCondition}
              onChange={(e) => {
                setQueryCondition(e.target.value as string);
                setQueryAttribute('');
              }}
              placeholder="Condition"
              items={queryConditions.map(c => ({ _id: c.value, name: c.label }))}
              disabled={!queryEntityType}
              sx={{ minWidth: 90, '& .select-component': { height: 30, fontSize: 12 } }}
            />
            <VWSelect
              id="query-attribute"
              value={queryAttribute}
              onChange={(e) => setQueryAttribute(e.target.value as string)}
              placeholder="Attribute"
              items={queryAttributes
                .filter(a => a.conditions?.includes(queryCondition))
                .map(a => ({ _id: a.value, name: a.label }))}
              disabled={!queryCondition}
              sx={{ minWidth: 130, '& .select-component': { height: 30, fontSize: 12 } }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyQuery}
              disabled={!queryEntityType || !queryCondition || !queryAttribute}
              sx={{
                textTransform: 'none',
                height: 30,
                fontSize: 11,
                backgroundColor: '#13715B',
                '&:hover': { backgroundColor: '#0f5a48' },
              }}
            >
              Apply
            </Button>
            {activeQuery && (
              <IconButton size="small" onClick={handleClearQuery} sx={{ p: 0.5 }}>
                <X size={14} />
              </IconButton>
            )}
          </Box>
        </Panel>


        {/* Path highlighting indicator */}
        {(highlightedPath.length > 0 || pathStartNode) && (
          <Panel position="bottom-center">
            <Box sx={{
              backgroundColor: 'white',
              p: 1.5,
              borderRadius: '4px',
              border: '1px solid #13715B',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}>
              <Link2 size={16} color="#13715B" />
              <Typography sx={{ fontSize: 12, color: '#344054' }}>
                {pathStartNode && highlightedPath.length === 1
                  ? 'Ctrl+click another node to show path'
                  : `Path: ${highlightedPath.length} nodes connected`}
              </Typography>
              <Button
                size="small"
                onClick={handleClearPath}
                sx={{ minWidth: 'auto', p: 0.5, color: '#667085' }}
              >
                <X size={14} />
              </Button>
            </Box>
          </Panel>
        )}

        {/* Phase 7: Enhanced quick actions bar for multi-select */}
        {selectedNodes.size > 0 && (
          <Panel position="bottom-left">
            <Box sx={{
              backgroundColor: 'white',
              p: 1,
              borderRadius: '4px',
              border: '1px solid #d0d5dd',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}>
              <Chip
                size="small"
                label={`${selectedNodes.size} selected`}
                sx={{ backgroundColor: '#13715B', color: 'white', fontSize: 11, height: 24, borderRadius: '4px' }}
              />
              <VWTooltip content="Analyze impact of selected">
                <Button
                  size="small"
                  sx={{ minWidth: 'auto', p: 0.5, color: '#344054' }}
                  onClick={() => {
                    // Analyze impact for first selected node
                    const firstNode = Array.from(selectedNodes)[0];
                    if (firstNode) {
                      handleImpactAnalysis(firstNode);
                      setImpactMode(true);
                    }
                  }}
                >
                  <Zap size={14} />
                </Button>
              </VWTooltip>
              <VWTooltip content="Export selected as JSON">
                <Button
                  size="small"
                  sx={{ minWidth: 'auto', p: 0.5, color: '#344054' }}
                  onClick={() => {
                    const selectedData = Array.from(selectedNodes)
                      .map(id => {
                        const data = entityLookup.get(id);
                        const node = nodes.find(n => n.id === id);
                        const nodeData = node?.data as ExtendedNodeData | undefined;
                        if (!data) return null;
                        return {
                          id,
                          type: nodeData?.entityType,
                          label: nodeData?.label,
                          ...data
                        };
                      })
                      .filter(Boolean);
                    const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `selected-entities-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={14} />
                </Button>
              </VWTooltip>
              <VWTooltip content="Find path between selected">
                <Button
                  size="small"
                  disabled={selectedNodes.size !== 2}
                  sx={{ minWidth: 'auto', p: 0.5, color: selectedNodes.size === 2 ? '#344054' : '#9ca3af' }}
                  onClick={() => {
                    if (selectedNodes.size === 2) {
                      const [start, end] = Array.from(selectedNodes);
                      const path = findShortestPath(start, end, edges);
                      setHighlightedPath(path);
                      setSelectedNodes(new Set());
                    }
                  }}
                >
                  <GitBranch size={14} />
                </Button>
              </VWTooltip>
              <VWTooltip content="Clear selection">
                <Button
                  size="small"
                  onClick={handleClearSelection}
                  sx={{ minWidth: 'auto', p: 0.5, color: '#667085' }}
                >
                  <X size={14} />
                </Button>
              </VWTooltip>
            </Box>
          </Panel>
        )}
      </ReactFlow>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleViewDetails} sx={{ fontSize: 13 }}>
          <Eye size={14} style={{ marginRight: 8 }} />
          View details
        </MenuItem>
        <MenuItem onClick={handleShowConnections} sx={{ fontSize: 13 }}>
          <Link2 size={14} style={{ marginRight: 8 }} />
          Show connections
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (contextMenu?.nodeId) {
              handleImpactAnalysis(contextMenu.nodeId);
              setImpactMode(true);
            }
            setContextMenu(null);
          }}
          sx={{ fontSize: 13 }}
        >
          <Zap size={14} style={{ marginRight: 8 }} />
          Analyze impact
        </MenuItem>
        {(contextMenu?.nodeId.startsWith('model-') || contextMenu?.nodeId.startsWith('control-')) && (
          <MenuItem
            onClick={() => {
              if (contextMenu?.nodeId) {
                handleShowCompliancePath(contextMenu.nodeId);
              }
              setContextMenu(null);
            }}
            sx={{ fontSize: 13 }}
          >
            <GitBranch size={14} style={{ marginRight: 8 }} />
            Show compliance path
          </MenuItem>
        )}
        {editMode && (
          <MenuItem
            onClick={() => {
              // TODO: Implement edit entity
              console.log('Edit:', contextMenu?.nodeId);
              setContextMenu(null);
            }}
            sx={{ fontSize: 13 }}
          >
            <Edit3 size={14} style={{ marginRight: 8 }} />
            Edit
          </MenuItem>
        )}
      </Menu>

      {/* Detail Sidebar */}
      <DetailSidebar
        entity={selectedEntity}
        onClose={handleCloseSidebar}
        onNavigateToEntity={handleNavigateToEntity}
      />

      {/* Phase 3: Save View Modal */}
      <StandardModal
        isOpen={saveViewDialogOpen}
        onClose={() => setSaveViewDialogOpen(false)}
        title="Save current view"
        description="This will save your current entity visibility, relationship filters, and query settings."
        onSubmit={handleSaveView}
        submitButtonText="Save view"
        maxWidth="480px"
        isSubmitting={!newViewName.trim()}
      >
        <Field
          label="View name"
          placeholder="Enter a name for this view"
          value={newViewName}
          onChange={(e) => setNewViewName(e.target.value)}
        />
      </StandardModal>

      {/* Phase 3: Load View Modal */}
      <StandardModal
        isOpen={loadViewDialogOpen}
        onClose={() => {
          setLoadViewDialogOpen(false);
          setSelectedViewToLoad(null);
        }}
        title="Load saved view"
        description="Select a saved view to restore its settings."
        maxWidth="480px"
        onSubmit={() => {
          if (selectedViewToLoad) {
            handleLoadView(selectedViewToLoad);
            setSelectedViewToLoad(null);
          }
        }}
        submitButtonText="Load"
        isSubmitting={!selectedViewToLoad}
      >
        {savedViews.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13, color: '#667085' }}>No saved views yet</Typography>
          </Box>
        ) : (
          <List dense sx={{ mx: -2.5, mt: -2 }}>
            {savedViews.map((view) => (
              <ListItem
                key={view.id}
                sx={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: selectedViewToLoad?.id === view.id ? '#eff6ff' : 'transparent',
                  '&:hover': { backgroundColor: selectedViewToLoad?.id === view.id ? '#dbeafe' : '#f9fafb' },
                  cursor: 'pointer',
                  border: selectedViewToLoad?.id === view.id ? '1px solid #3b82f6' : 'none',
                  borderRadius: selectedViewToLoad?.id === view.id ? '4px' : 0,
                }}
                onClick={() => setSelectedViewToLoad(view)}
              >
                <ListItemText
                  primary={view.name}
                  secondary={`Created ${new Date(view.createdAt).toLocaleDateString()}`}
                  primaryTypographyProps={{ sx: { fontSize: 13, fontWeight: 500 } }}
                  secondaryTypographyProps={{ sx: { fontSize: 11 } }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteView(view.id);
                    }}
                  >
                    <Trash2 size={14} color="#667085" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </StandardModal>
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
