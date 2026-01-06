/**
 * @fileoverview AI Dependency Graph Component
 *
 * Force-directed graph visualization of AI/ML components and their relationships.
 * Uses @xyflow/react for the graph rendering.
 */

import React, { useCallback, useEffect, useState, useMemo } from "react";
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
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { Network, X, AlertTriangle } from "lucide-react";
import AIDepNode from "./AIDepNode";
import { getDependencyGraph } from "../../../application/repository/aiDetection.repository";
import type {
  DependencyGraphResponse,
  DependencyNodeType,
  FilePath,
} from "../../../domain/ai-detection/types";
import type { AIDepNodeData } from "./types";
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, CONFIDENCE_COLORS } from "./types";
import {
  graphContainerStyle,
  loadingContainerSx,
  loadingTextSx,
  errorContainerSx,
  errorTextSx,
  emptyStateContainerSx,
  emptyStateTitleSx,
  emptyStateDescriptionSx,
  controlPanelSx,
  legendLabelSx,
  colorDotSx,
  statsContainerSx,
  statsTextSx,
  sidebarContainerSx,
  sidebarHeaderSx,
  sidebarTitleSx,
  sidebarContentSx,
  sidebarSectionSx,
  sidebarLabelSx,
  sidebarValueSx,
  filePathSx,
  sidebarTableSx,
  sidebarTableCellSx,
  sidebarTableLabelSx,
  sidebarTableValueSx,
} from "./styles";

// Register custom node types
const nodeTypes = { aiDep: AIDepNode };

// Force layout parameters
const FORCE_LAYOUT = {
  repulsionForce: 300,
  linkDistance: 150,
  centerForce: 0.05,
  iterations: 100,
};

interface SelectedNodeDetails {
  id: string;
  label: string;
  sublabel?: string;
  nodeType: DependencyNodeType;
  provider: string;
  confidence: string;
  riskLevel: string;
  fileCount: number;
  filePaths: FilePath[];
  governanceStatus?: string | null;
}

interface AIDepGraphProps {
  scanId: number;
  repositoryUrl?: string;
}

/**
 * Simple force-directed layout algorithm
 */
function applyForceLayout(
  nodes: Node[],
  edges: Edge[],
  width: number,
  height: number
): Node[] {
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();

  // Initialize positions randomly
  nodes.forEach((node) => {
    positions.set(node.id, {
      x: Math.random() * width * 0.6 + width * 0.2,
      y: Math.random() * height * 0.6 + height * 0.2,
      vx: 0,
      vy: 0,
    });
  });

  // Run simulation
  for (let i = 0; i < FORCE_LAYOUT.iterations; i++) {
    const alpha = 1 - i / FORCE_LAYOUT.iterations;

    // Repulsion between all nodes
    nodes.forEach((n1) => {
      const p1 = positions.get(n1.id)!;
      nodes.forEach((n2) => {
        if (n1.id === n2.id) return;
        const p2 = positions.get(n2.id)!;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (FORCE_LAYOUT.repulsionForce * alpha) / dist;
        p1.vx += (dx / dist) * force;
        p1.vy += (dy / dist) * force;
      });
    });

    // Attraction along edges
    edges.forEach((edge) => {
      const p1 = positions.get(edge.source);
      const p2 = positions.get(edge.target);
      if (!p1 || !p2) return;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = ((dist - FORCE_LAYOUT.linkDistance) * alpha * 0.1) / dist;
      p1.vx += dx * force;
      p1.vy += dy * force;
      p2.vx -= dx * force;
      p2.vy -= dy * force;
    });

    // Center gravity
    nodes.forEach((node) => {
      const p = positions.get(node.id)!;
      p.vx += (width / 2 - p.x) * FORCE_LAYOUT.centerForce * alpha;
      p.vy += (height / 2 - p.y) * FORCE_LAYOUT.centerForce * alpha;
    });

    // Apply velocities
    nodes.forEach((node) => {
      const p = positions.get(node.id)!;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.9;
      // Keep within bounds
      p.x = Math.max(50, Math.min(width - 50, p.x));
      p.y = Math.max(50, Math.min(height - 50, p.y));
    });
  }

  // Apply final positions
  return nodes.map((node) => ({
    ...node,
    position: {
      x: positions.get(node.id)!.x,
      y: positions.get(node.id)!.y,
    },
  }));
}

/**
 * Transform API data to ReactFlow nodes and edges
 */
function transformToReactFlow(
  data: DependencyGraphResponse,
  visibleTypes: DependencyNodeType[]
): { nodes: Node[]; edges: Edge[] } {
  // Filter nodes by visible types
  const filteredNodes = data.nodes.filter((n) => visibleTypes.includes(n.type));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Create ReactFlow nodes
  const nodes: Node[] = filteredNodes.map((node) => ({
    id: node.id,
    type: "aiDep",
    position: { x: 0, y: 0 }, // Will be set by layout
    data: {
      label: node.label,
      sublabel: node.sublabel || node.provider,
      nodeType: node.type,
      color: NODE_TYPE_COLORS[node.type],
      provider: node.provider,
      confidence: node.confidence,
      riskLevel: node.riskLevel,
      fileCount: node.fileCount,
      filePaths: node.filePaths,
      governanceStatus: node.governanceStatus,
      findingId: node.findingId,
      connectionCount: 0,
    } as AIDepNodeData,
  }));

  // Create edges (only for visible nodes)
  const edges: Edge[] = data.edges
    .filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: edge.relationship === "calls",
      style: {
        stroke: CONFIDENCE_COLORS[edge.confidence],
        strokeWidth: edge.confidence === "high" ? 2 : 1,
      },
      label: edge.relationship,
      labelStyle: { fontSize: 9, fill: "#667085" },
      labelBgStyle: { fill: "white", fillOpacity: 0.9 },
    }));

  // Calculate connection counts
  const connectionCounts = new Map<string, number>();
  edges.forEach((edge) => {
    connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
    connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
  });

  nodes.forEach((node) => {
    (node.data as AIDepNodeData).connectionCount = connectionCounts.get(node.id) || 0;
  });

  return { nodes, edges };
}

const AIDepGraphInner: React.FC<AIDepGraphProps> = ({ scanId, repositoryUrl }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<DependencyGraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNodeDetails | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<DependencyNodeType[]>([
    "library",
    "model",
    "api",
    "secret",
    "rag",
    "agent",
  ]);

  const { fitView } = useReactFlow();

  // Fetch graph data
  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDependencyGraph(scanId, controller.signal);
        setGraphData(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("Failed to load dependency graph");
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => controller.abort();
  }, [scanId]);

  // Transform and layout nodes when data or filters change
  useEffect(() => {
    if (!graphData) return;

    const { nodes: rawNodes, edges: rawEdges } = transformToReactFlow(
      graphData,
      visibleTypes
    );

    if (rawNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Apply force layout
    const layoutedNodes = applyForceLayout(rawNodes, rawEdges, 800, 600);
    setNodes(layoutedNodes);
    setEdges(rawEdges);

    // Fit view after layout
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [graphData, visibleTypes, setNodes, setEdges, fitView]);

  // Handle node click
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const data = node.data as AIDepNodeData;
    setSelectedNode({
      id: node.id,
      label: data.label,
      sublabel: data.sublabel,
      nodeType: data.nodeType,
      provider: data.provider,
      confidence: data.confidence,
      riskLevel: data.riskLevel,
      fileCount: data.fileCount,
      filePaths: data.filePaths,
      governanceStatus: data.governanceStatus,
    });
  }, []);

  // Handle type filter change
  const handleTypeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newTypes: DependencyNodeType[]) => {
      if (newTypes.length > 0) {
        setVisibleTypes(newTypes);
      }
    },
    []
  );

  // Get visible node types from data
  const availableTypes = useMemo(() => {
    if (!graphData) return [];
    const types = new Set(graphData.nodes.map((n) => n.type));
    return Array.from(types);
  }, [graphData]);

  // Open file in GitHub
  const openFileInGitHub = useCallback(
    (filePath: FilePath) => {
      if (!repositoryUrl) return;
      const baseUrl = repositoryUrl.replace(/\.git$/, "");
      const lineParam = filePath.line_number ? `#L${filePath.line_number}` : "";
      const url = `${baseUrl}/blob/main/${filePath.path}${lineParam}`;
      window.open(url, "_blank");
    },
    [repositoryUrl]
  );

  if (loading) {
    return (
      <Box sx={loadingContainerSx}>
        <CircularProgress size={32} sx={{ color: "#13715B" }} />
        <Typography sx={loadingTextSx}>Loading dependency graph...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={errorContainerSx}>
        <AlertTriangle size={32} color="#ef4444" />
        <Typography sx={errorTextSx}>{error}</Typography>
      </Box>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Box sx={emptyStateContainerSx}>
        <Network size={48} color="#9ca3af" />
        <Typography sx={emptyStateTitleSx}>No dependencies found</Typography>
        <Typography sx={emptyStateDescriptionSx}>
          This scan did not detect any AI/ML dependencies to visualize.
        </Typography>
      </Box>
    );
  }

  return (
    <div style={graphContainerStyle}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => (n.data as AIDepNodeData)?.color || "#667085"}
          maskColor="rgba(0,0,0,0.1)"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />

        {/* Control Panel */}
        <Panel position="top-left">
          <Stack sx={controlPanelSx}>
            <Typography sx={legendLabelSx}>Component types</Typography>
            <ToggleButtonGroup
              value={visibleTypes}
              onChange={handleTypeChange}
              orientation="vertical"
              size="small"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                "& .MuiToggleButton-root": {
                  border: "1px solid #d0d5dd",
                  borderRadius: "4px !important",
                  textTransform: "none",
                  fontSize: 10,
                  py: 0.25,
                  px: 1,
                  justifyContent: "flex-start",
                  "&.Mui-selected": {
                    backgroundColor: "#f0fdf4",
                    borderColor: "#13715B",
                    color: "#13715B",
                  },
                },
              }}
            >
              {availableTypes.map((type) => (
                <ToggleButton key={type} value={type}>
                  <Box sx={colorDotSx(NODE_TYPE_COLORS[type])} />
                  <Typography sx={{ fontSize: 10, ml: 0.5 }}>
                    {NODE_TYPE_LABELS[type]}
                  </Typography>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Box sx={statsContainerSx}>
              <Typography sx={statsTextSx}>
                {nodes.length} components, {edges.length} relationships
              </Typography>
            </Box>
          </Stack>
        </Panel>
      </ReactFlow>

      {/* Detail Sidebar */}
      {selectedNode && (
        <Box sx={sidebarContainerSx}>
          <Box sx={sidebarHeaderSx}>
            <Typography sx={sidebarTitleSx}>{selectedNode.label}</Typography>
            <IconButton size="small" onClick={() => setSelectedNode(null)}>
              <X size={16} />
            </IconButton>
          </Box>
          <Box sx={sidebarContentSx}>
            {/* Metadata Table */}
            <Box sx={sidebarTableSx}>
              {/* Type */}
              <Box sx={sidebarTableCellSx}>
                <Typography sx={sidebarTableLabelSx}>Type</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={colorDotSx(NODE_TYPE_COLORS[selectedNode.nodeType])} />
                  <Typography sx={sidebarTableValueSx}>
                    {NODE_TYPE_LABELS[selectedNode.nodeType]}
                  </Typography>
                </Box>
              </Box>

              {/* Provider */}
              <Box sx={sidebarTableCellSx}>
                <Typography sx={sidebarTableLabelSx}>Provider</Typography>
                <Typography sx={sidebarTableValueSx}>{selectedNode.provider}</Typography>
              </Box>

              {/* Confidence */}
              <Box sx={sidebarTableCellSx}>
                <Typography sx={sidebarTableLabelSx}>Confidence</Typography>
                <Typography
                  sx={{ ...sidebarTableValueSx, textTransform: "capitalize" }}
                >
                  {selectedNode.confidence}
                </Typography>
              </Box>

              {/* Risk level */}
              <Box sx={sidebarTableCellSx}>
                <Typography sx={sidebarTableLabelSx}>Risk level</Typography>
                <Typography
                  sx={{
                    ...sidebarTableValueSx,
                    color:
                      selectedNode.riskLevel === "high"
                        ? "#ef4444"
                        : selectedNode.riskLevel === "medium"
                        ? "#f59e0b"
                        : "#10b981",
                    textTransform: "capitalize",
                  }}
                >
                  {selectedNode.riskLevel}
                </Typography>
              </Box>
            </Box>

            {selectedNode.governanceStatus && (
              <Box sx={sidebarSectionSx}>
                <Typography sx={sidebarLabelSx}>Governance status</Typography>
                <Typography
                  sx={{ ...sidebarValueSx, textTransform: "capitalize" }}
                >
                  {selectedNode.governanceStatus}
                </Typography>
              </Box>
            )}

            <Box sx={sidebarSectionSx}>
              <Typography sx={sidebarLabelSx}>
                Files ({selectedNode.fileCount})
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                {selectedNode.filePaths.slice(0, 10).map((fp, idx) => (
                  <Typography
                    key={idx}
                    sx={filePathSx}
                    onClick={() => openFileInGitHub(fp)}
                  >
                    {fp.path}
                    {fp.line_number && `:${fp.line_number}`}
                  </Typography>
                ))}
                {selectedNode.fileCount > 10 && (
                  <Typography sx={{ fontSize: 11, color: "#667085", mt: 0.5 }}>
                    +{selectedNode.fileCount - 10} more files
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </div>
  );
};

const AIDepGraph: React.FC<AIDepGraphProps> = (props) => (
  <ReactFlowProvider>
    <AIDepGraphInner {...props} />
  </ReactFlowProvider>
);

export default AIDepGraph;
