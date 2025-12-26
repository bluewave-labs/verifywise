import { useReducer, useCallback } from 'react';
import type { AlertProps } from '../../../../domain/interfaces/i.alert';
import type { EntityDetails } from '../DetailSidebar';
import type { GapRule, GapResult, SavedView, ExtendedNodeData } from '../types';
import { defaultGapRules, defaultVisibleRelationships } from '../constants';

// State interfaces
interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  nodeId: string;
  nodeData: ExtendedNodeData;
}

interface QueryState {
  entityType: string;
  condition: string;
  attribute: string;
}

// Main state shape
export interface EntityGraphState {
  // Loading state
  loading: boolean;
  loadingProgress: number;
  error: string | null;

  // Data state
  entityLookup: Map<string, Record<string, unknown>>;
  selectedEntity: EntityDetails | null;

  // Filter state
  visibleEntities: string[];
  visibleRelationships: string[];
  showProblemsOnly: boolean;
  showGapsOnly: boolean;
  searchQuery: string;
  debouncedSearchQuery: string;

  // Query builder state
  activeQuery: QueryState | undefined;
  queryEntityType: string;
  queryCondition: string;
  queryAttribute: string;

  // Interaction state
  editMode: boolean;
  contextMenu: ContextMenuState | null;
  selectedNodes: Set<string>;
  pathStartNode: string | null;
  highlightedPath: string[];
  highlightedNodeId: string | null;

  // Views state
  savedViews: SavedView[];
  saveViewDialogOpen: boolean;
  loadViewDialogOpen: boolean;
  newViewName: string;
  selectedViewToLoad: SavedView | null;
  legendCollapsed: boolean;

  // Gap detection state
  gapRules: GapRule[];
  gapResults: Map<string, GapResult>;
  gapSettingsOpen: boolean;
  selectedGapTemplate: string;

  // Impact analysis state
  impactMode: boolean;
  impactSourceNode: string | null;
  impactedNodes: Map<string, number>;
  impactDepth: number;
  whatIfMode: boolean;
  whatIfRemovedNode: string | null;
  compliancePath: string[];
  impactSettingsOpen: boolean;

  // UI state
  alert: AlertProps | null;
  runEntityGraphTour: boolean;
  exportMenuAnchor: HTMLElement | null;
  exporting: boolean;
}

// Action types
type EntityGraphAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_PROGRESS'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENTITY_LOOKUP'; payload: Map<string, Record<string, unknown>> }
  | { type: 'SET_SELECTED_ENTITY'; payload: EntityDetails | null }
  | { type: 'SET_VISIBLE_ENTITIES'; payload: string[] }
  | { type: 'ADD_VISIBLE_ENTITY'; payload: string }
  | { type: 'SET_VISIBLE_RELATIONSHIPS'; payload: string[] }
  | { type: 'SET_SHOW_PROBLEMS_ONLY'; payload: boolean }
  | { type: 'SET_SHOW_GAPS_ONLY'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_DEBOUNCED_SEARCH_QUERY'; payload: string }
  | { type: 'SET_ACTIVE_QUERY'; payload: QueryState | undefined }
  | { type: 'SET_QUERY_ENTITY_TYPE'; payload: string }
  | { type: 'SET_QUERY_CONDITION'; payload: string }
  | { type: 'SET_QUERY_ATTRIBUTE'; payload: string }
  | { type: 'CLEAR_QUERY' }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_CONTEXT_MENU'; payload: ContextMenuState | null }
  | { type: 'SET_SELECTED_NODES'; payload: Set<string> }
  | { type: 'TOGGLE_SELECTED_NODE'; payload: string }
  | { type: 'SET_PATH_START_NODE'; payload: string | null }
  | { type: 'SET_HIGHLIGHTED_PATH'; payload: string[] }
  | { type: 'SET_HIGHLIGHTED_NODE_ID'; payload: string | null }
  | { type: 'CLEAR_PATH_HIGHLIGHTING' }
  | { type: 'SET_SAVED_VIEWS'; payload: SavedView[] }
  | { type: 'ADD_SAVED_VIEW'; payload: SavedView }
  | { type: 'DELETE_SAVED_VIEW'; payload: string }
  | { type: 'SET_SAVE_VIEW_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_LOAD_VIEW_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_NEW_VIEW_NAME'; payload: string }
  | { type: 'SET_SELECTED_VIEW_TO_LOAD'; payload: SavedView | null }
  | { type: 'SET_LEGEND_COLLAPSED'; payload: boolean }
  | { type: 'SET_GAP_RULES'; payload: GapRule[] }
  | { type: 'SET_GAP_RESULTS'; payload: Map<string, GapResult> }
  | { type: 'SET_GAP_SETTINGS_OPEN'; payload: boolean }
  | { type: 'SET_SELECTED_GAP_TEMPLATE'; payload: string }
  | { type: 'SET_IMPACT_MODE'; payload: boolean }
  | { type: 'SET_IMPACT_SOURCE_NODE'; payload: string | null }
  | { type: 'SET_IMPACTED_NODES'; payload: Map<string, number> }
  | { type: 'SET_IMPACT_DEPTH'; payload: number }
  | { type: 'SET_WHAT_IF_MODE'; payload: boolean }
  | { type: 'SET_WHAT_IF_REMOVED_NODE'; payload: string | null }
  | { type: 'SET_COMPLIANCE_PATH'; payload: string[] }
  | { type: 'SET_IMPACT_SETTINGS_OPEN'; payload: boolean }
  | { type: 'CLEAR_IMPACT_ANALYSIS' }
  | { type: 'SET_ALERT'; payload: AlertProps | null }
  | { type: 'SET_RUN_ENTITY_GRAPH_TOUR'; payload: boolean }
  | { type: 'SET_EXPORT_MENU_ANCHOR'; payload: HTMLElement | null }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'LOAD_VIEW'; payload: SavedView }
  | { type: 'RESET_FILTERS' };

// Initial state
const initialState: EntityGraphState = {
  loading: true,
  loadingProgress: 0,
  error: null,
  entityLookup: new Map(),
  selectedEntity: null,
  visibleEntities: ['useCases', 'models', 'vendors', 'risks'],
  visibleRelationships: defaultVisibleRelationships,
  showProblemsOnly: false,
  showGapsOnly: false,
  searchQuery: '',
  debouncedSearchQuery: '',
  activeQuery: undefined,
  queryEntityType: '',
  queryCondition: '',
  queryAttribute: '',
  editMode: false,
  contextMenu: null,
  selectedNodes: new Set(),
  pathStartNode: null,
  highlightedPath: [],
  highlightedNodeId: null,
  savedViews: [],
  saveViewDialogOpen: false,
  loadViewDialogOpen: false,
  newViewName: '',
  selectedViewToLoad: null,
  legendCollapsed: false,
  gapRules: defaultGapRules,
  gapResults: new Map(),
  gapSettingsOpen: false,
  selectedGapTemplate: 'standard',
  impactMode: false,
  impactSourceNode: null,
  impactedNodes: new Map(),
  impactDepth: 2,
  whatIfMode: false,
  whatIfRemovedNode: null,
  compliancePath: [],
  impactSettingsOpen: false,
  alert: null,
  runEntityGraphTour: false,
  exportMenuAnchor: null,
  exporting: false,
};

// Reducer function
function entityGraphReducer(state: EntityGraphState, action: EntityGraphAction): EntityGraphState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_LOADING_PROGRESS':
      return { ...state, loadingProgress: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ENTITY_LOOKUP':
      return { ...state, entityLookup: action.payload };
    case 'SET_SELECTED_ENTITY':
      return { ...state, selectedEntity: action.payload };
    case 'SET_VISIBLE_ENTITIES':
      return { ...state, visibleEntities: action.payload };
    case 'ADD_VISIBLE_ENTITY':
      return state.visibleEntities.includes(action.payload)
        ? state
        : { ...state, visibleEntities: [...state.visibleEntities, action.payload] };
    case 'SET_VISIBLE_RELATIONSHIPS':
      return { ...state, visibleRelationships: action.payload };
    case 'SET_SHOW_PROBLEMS_ONLY':
      return { ...state, showProblemsOnly: action.payload };
    case 'SET_SHOW_GAPS_ONLY':
      return { ...state, showGapsOnly: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_DEBOUNCED_SEARCH_QUERY':
      return { ...state, debouncedSearchQuery: action.payload };
    case 'SET_ACTIVE_QUERY':
      return { ...state, activeQuery: action.payload };
    case 'SET_QUERY_ENTITY_TYPE':
      return { ...state, queryEntityType: action.payload };
    case 'SET_QUERY_CONDITION':
      return { ...state, queryCondition: action.payload };
    case 'SET_QUERY_ATTRIBUTE':
      return { ...state, queryAttribute: action.payload };
    case 'CLEAR_QUERY':
      return {
        ...state,
        activeQuery: undefined,
        queryEntityType: '',
        queryCondition: '',
        queryAttribute: '',
      };
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };
    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };
    case 'SET_SELECTED_NODES':
      return { ...state, selectedNodes: action.payload };
    case 'TOGGLE_SELECTED_NODE': {
      const newSet = new Set(state.selectedNodes);
      if (newSet.has(action.payload)) {
        newSet.delete(action.payload);
      } else {
        newSet.add(action.payload);
      }
      return { ...state, selectedNodes: newSet };
    }
    case 'SET_PATH_START_NODE':
      return { ...state, pathStartNode: action.payload };
    case 'SET_HIGHLIGHTED_PATH':
      return { ...state, highlightedPath: action.payload };
    case 'SET_HIGHLIGHTED_NODE_ID':
      return { ...state, highlightedNodeId: action.payload };
    case 'CLEAR_PATH_HIGHLIGHTING':
      return { ...state, highlightedPath: [], pathStartNode: null };
    case 'SET_SAVED_VIEWS':
      return { ...state, savedViews: action.payload };
    case 'ADD_SAVED_VIEW':
      return { ...state, savedViews: [...state.savedViews, action.payload] };
    case 'DELETE_SAVED_VIEW':
      return { ...state, savedViews: state.savedViews.filter(v => v.id !== action.payload) };
    case 'SET_SAVE_VIEW_DIALOG_OPEN':
      return { ...state, saveViewDialogOpen: action.payload };
    case 'SET_LOAD_VIEW_DIALOG_OPEN':
      return { ...state, loadViewDialogOpen: action.payload };
    case 'SET_NEW_VIEW_NAME':
      return { ...state, newViewName: action.payload };
    case 'SET_SELECTED_VIEW_TO_LOAD':
      return { ...state, selectedViewToLoad: action.payload };
    case 'SET_LEGEND_COLLAPSED':
      return { ...state, legendCollapsed: action.payload };
    case 'SET_GAP_RULES':
      return { ...state, gapRules: action.payload };
    case 'SET_GAP_RESULTS':
      return { ...state, gapResults: action.payload };
    case 'SET_GAP_SETTINGS_OPEN':
      return { ...state, gapSettingsOpen: action.payload };
    case 'SET_SELECTED_GAP_TEMPLATE':
      return { ...state, selectedGapTemplate: action.payload };
    case 'SET_IMPACT_MODE':
      return { ...state, impactMode: action.payload };
    case 'SET_IMPACT_SOURCE_NODE':
      return { ...state, impactSourceNode: action.payload };
    case 'SET_IMPACTED_NODES':
      return { ...state, impactedNodes: action.payload };
    case 'SET_IMPACT_DEPTH':
      return { ...state, impactDepth: action.payload };
    case 'SET_WHAT_IF_MODE':
      return { ...state, whatIfMode: action.payload };
    case 'SET_WHAT_IF_REMOVED_NODE':
      return { ...state, whatIfRemovedNode: action.payload };
    case 'SET_COMPLIANCE_PATH':
      return { ...state, compliancePath: action.payload };
    case 'SET_IMPACT_SETTINGS_OPEN':
      return { ...state, impactSettingsOpen: action.payload };
    case 'CLEAR_IMPACT_ANALYSIS':
      return {
        ...state,
        impactSourceNode: null,
        impactedNodes: new Map(),
        compliancePath: [],
        whatIfRemovedNode: null,
      };
    case 'SET_ALERT':
      return { ...state, alert: action.payload };
    case 'SET_RUN_ENTITY_GRAPH_TOUR':
      return { ...state, runEntityGraphTour: action.payload };
    case 'SET_EXPORT_MENU_ANCHOR':
      return { ...state, exportMenuAnchor: action.payload };
    case 'SET_EXPORTING':
      return { ...state, exporting: action.payload };
    case 'LOAD_VIEW':
      return {
        ...state,
        visibleEntities: action.payload.visibleEntities,
        visibleRelationships: action.payload.visibleRelationships,
        showProblemsOnly: action.payload.showProblemsOnly,
        activeQuery: action.payload.query,
        queryEntityType: action.payload.query?.entityType || '',
        queryCondition: action.payload.query?.condition || '',
        queryAttribute: action.payload.query?.attribute || '',
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        showProblemsOnly: false,
        showGapsOnly: false,
        searchQuery: '',
        debouncedSearchQuery: '',
        activeQuery: undefined,
        queryEntityType: '',
        queryCondition: '',
        queryAttribute: '',
      };
    default:
      return state;
  }
}

/**
 * Custom hook for Entity Graph state management
 * Consolidates all useState calls into a single reducer for better performance and organization
 */
export function useEntityGraphState() {
  const [state, dispatch] = useReducer(entityGraphReducer, initialState);

  // Action creators for common operations
  const actions = {
    setLoading: useCallback((loading: boolean) =>
      dispatch({ type: 'SET_LOADING', payload: loading }), []),
    setLoadingProgress: useCallback((progress: number) =>
      dispatch({ type: 'SET_LOADING_PROGRESS', payload: progress }), []),
    setError: useCallback((error: string | null) =>
      dispatch({ type: 'SET_ERROR', payload: error }), []),
    setEntityLookup: useCallback((lookup: Map<string, Record<string, unknown>>) =>
      dispatch({ type: 'SET_ENTITY_LOOKUP', payload: lookup }), []),
    setSelectedEntity: useCallback((entity: EntityDetails | null) =>
      dispatch({ type: 'SET_SELECTED_ENTITY', payload: entity }), []),
    setVisibleEntities: useCallback((entities: string[]) =>
      dispatch({ type: 'SET_VISIBLE_ENTITIES', payload: entities }), []),
    addVisibleEntity: useCallback((entity: string) =>
      dispatch({ type: 'ADD_VISIBLE_ENTITY', payload: entity }), []),
    setVisibleRelationships: useCallback((relationships: string[]) =>
      dispatch({ type: 'SET_VISIBLE_RELATIONSHIPS', payload: relationships }), []),
    setShowProblemsOnly: useCallback((show: boolean) =>
      dispatch({ type: 'SET_SHOW_PROBLEMS_ONLY', payload: show }), []),
    setShowGapsOnly: useCallback((show: boolean) =>
      dispatch({ type: 'SET_SHOW_GAPS_ONLY', payload: show }), []),
    setSearchQuery: useCallback((query: string) =>
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query }), []),
    setDebouncedSearchQuery: useCallback((query: string) =>
      dispatch({ type: 'SET_DEBOUNCED_SEARCH_QUERY', payload: query }), []),
    setActiveQuery: useCallback((query: { entityType: string; condition: string; attribute: string } | undefined) =>
      dispatch({ type: 'SET_ACTIVE_QUERY', payload: query }), []),
    setQueryEntityType: useCallback((type: string) =>
      dispatch({ type: 'SET_QUERY_ENTITY_TYPE', payload: type }), []),
    setQueryCondition: useCallback((condition: string) =>
      dispatch({ type: 'SET_QUERY_CONDITION', payload: condition }), []),
    setQueryAttribute: useCallback((attribute: string) =>
      dispatch({ type: 'SET_QUERY_ATTRIBUTE', payload: attribute }), []),
    clearQuery: useCallback(() =>
      dispatch({ type: 'CLEAR_QUERY' }), []),
    setEditMode: useCallback((mode: boolean) =>
      dispatch({ type: 'SET_EDIT_MODE', payload: mode }), []),
    setContextMenu: useCallback((menu: ContextMenuState | null) =>
      dispatch({ type: 'SET_CONTEXT_MENU', payload: menu }), []),
    setSelectedNodes: useCallback((nodes: Set<string>) =>
      dispatch({ type: 'SET_SELECTED_NODES', payload: nodes }), []),
    toggleSelectedNode: useCallback((nodeId: string) =>
      dispatch({ type: 'TOGGLE_SELECTED_NODE', payload: nodeId }), []),
    setPathStartNode: useCallback((nodeId: string | null) =>
      dispatch({ type: 'SET_PATH_START_NODE', payload: nodeId }), []),
    setHighlightedPath: useCallback((path: string[]) =>
      dispatch({ type: 'SET_HIGHLIGHTED_PATH', payload: path }), []),
    setHighlightedNodeId: useCallback((nodeId: string | null) =>
      dispatch({ type: 'SET_HIGHLIGHTED_NODE_ID', payload: nodeId }), []),
    clearPathHighlighting: useCallback(() =>
      dispatch({ type: 'CLEAR_PATH_HIGHLIGHTING' }), []),
    setSavedViews: useCallback((views: SavedView[]) =>
      dispatch({ type: 'SET_SAVED_VIEWS', payload: views }), []),
    addSavedView: useCallback((view: SavedView) =>
      dispatch({ type: 'ADD_SAVED_VIEW', payload: view }), []),
    deleteSavedView: useCallback((id: string) =>
      dispatch({ type: 'DELETE_SAVED_VIEW', payload: id }), []),
    setSaveViewDialogOpen: useCallback((open: boolean) =>
      dispatch({ type: 'SET_SAVE_VIEW_DIALOG_OPEN', payload: open }), []),
    setLoadViewDialogOpen: useCallback((open: boolean) =>
      dispatch({ type: 'SET_LOAD_VIEW_DIALOG_OPEN', payload: open }), []),
    setNewViewName: useCallback((name: string) =>
      dispatch({ type: 'SET_NEW_VIEW_NAME', payload: name }), []),
    setSelectedViewToLoad: useCallback((view: SavedView | null) =>
      dispatch({ type: 'SET_SELECTED_VIEW_TO_LOAD', payload: view }), []),
    setLegendCollapsed: useCallback((collapsed: boolean) =>
      dispatch({ type: 'SET_LEGEND_COLLAPSED', payload: collapsed }), []),
    setGapRules: useCallback((rules: GapRule[]) =>
      dispatch({ type: 'SET_GAP_RULES', payload: rules }), []),
    setGapResults: useCallback((results: Map<string, GapResult>) =>
      dispatch({ type: 'SET_GAP_RESULTS', payload: results }), []),
    setGapSettingsOpen: useCallback((open: boolean) =>
      dispatch({ type: 'SET_GAP_SETTINGS_OPEN', payload: open }), []),
    setSelectedGapTemplate: useCallback((template: string) =>
      dispatch({ type: 'SET_SELECTED_GAP_TEMPLATE', payload: template }), []),
    setImpactMode: useCallback((mode: boolean) =>
      dispatch({ type: 'SET_IMPACT_MODE', payload: mode }), []),
    setImpactSourceNode: useCallback((nodeId: string | null) =>
      dispatch({ type: 'SET_IMPACT_SOURCE_NODE', payload: nodeId }), []),
    setImpactedNodes: useCallback((nodes: Map<string, number>) =>
      dispatch({ type: 'SET_IMPACTED_NODES', payload: nodes }), []),
    setImpactDepth: useCallback((depth: number) =>
      dispatch({ type: 'SET_IMPACT_DEPTH', payload: depth }), []),
    setWhatIfMode: useCallback((mode: boolean) =>
      dispatch({ type: 'SET_WHAT_IF_MODE', payload: mode }), []),
    setWhatIfRemovedNode: useCallback((nodeId: string | null) =>
      dispatch({ type: 'SET_WHAT_IF_REMOVED_NODE', payload: nodeId }), []),
    setCompliancePath: useCallback((path: string[]) =>
      dispatch({ type: 'SET_COMPLIANCE_PATH', payload: path }), []),
    setImpactSettingsOpen: useCallback((open: boolean) =>
      dispatch({ type: 'SET_IMPACT_SETTINGS_OPEN', payload: open }), []),
    clearImpactAnalysis: useCallback(() =>
      dispatch({ type: 'CLEAR_IMPACT_ANALYSIS' }), []),
    setAlert: useCallback((alert: AlertProps | null) =>
      dispatch({ type: 'SET_ALERT', payload: alert }), []),
    setRunEntityGraphTour: useCallback((run: boolean) =>
      dispatch({ type: 'SET_RUN_ENTITY_GRAPH_TOUR', payload: run }), []),
    setExportMenuAnchor: useCallback((anchor: HTMLElement | null) =>
      dispatch({ type: 'SET_EXPORT_MENU_ANCHOR', payload: anchor }), []),
    setExporting: useCallback((exporting: boolean) =>
      dispatch({ type: 'SET_EXPORTING', payload: exporting }), []),
    loadView: useCallback((view: SavedView) =>
      dispatch({ type: 'LOAD_VIEW', payload: view }), []),
    resetFilters: useCallback(() =>
      dispatch({ type: 'RESET_FILTERS' }), []),
  };

  return { state, actions, dispatch };
}

export type { EntityGraphAction, ContextMenuState, QueryState };
