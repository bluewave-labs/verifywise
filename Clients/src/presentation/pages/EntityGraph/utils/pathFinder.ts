import type { Edge } from '@xyflow/react';

/**
 * Result from getNodesWithinDepth - contains node ID and distance from source
 */
export interface ImpactedNodeResult {
  nodeId: string;
  distance: number;
  riskLevel?: number;
}

/**
 * Build an adjacency list from edges for graph traversal
 */
function buildAdjacencyList(edges: Edge[]): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) adjacencyList.set(edge.source, []);
    if (!adjacencyList.has(edge.target)) adjacencyList.set(edge.target, []);
    adjacencyList.get(edge.source)!.push(edge.target);
    adjacencyList.get(edge.target)!.push(edge.source);
  });
  return adjacencyList;
}

/**
 * Find the shortest path between two nodes using BFS
 * Returns an array of node IDs from start to end, or empty array if no path exists
 */
export function findShortestPath(
  startId: string,
  endId: string,
  edges: Edge[]
): string[] {
  if (startId === endId) return [startId];

  const adjacencyList = buildAdjacencyList(edges);
  const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    const neighbors = adjacencyList.get(id) || [];

    for (const neighbor of neighbors) {
      if (neighbor === endId) {
        return [...path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return []; // No path found
}

/**
 * Get all nodes within N hops from a starting node
 * Used for impact analysis to find affected entities
 */
export function getNodesWithinDepth(
  startId: string,
  edges: Edge[],
  maxDepth: number
): ImpactedNodeResult[] {
  const adjacencyList = buildAdjacencyList(edges);

  const result: ImpactedNodeResult[] = [{ nodeId: startId, distance: 0 }];
  const visited = new Set<string>([startId]);
  const queue: { id: string; distance: number }[] = [{ id: startId, distance: 0 }];

  while (queue.length > 0) {
    const { id, distance } = queue.shift()!;
    if (distance >= maxDepth) continue;

    const neighbors = adjacencyList.get(id) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        const newDistance = distance + 1;
        result.push({ nodeId: neighbor, distance: newDistance });
        queue.push({ id: neighbor, distance: newDistance });
      }
    }
  }

  return result;
}

/**
 * Get compliance path from a model to framework
 * Traverses the graph to find a path from the starting node to any framework node
 */
export function getCompliancePath(
  startNodeId: string,
  edges: Edge[]
): { path: string[]; pathType: string } {
  const path: string[] = [startNodeId];

  // Build adjacency list with edge labels
  const adjacencyList = new Map<string, { target: string; label: string }[]>();
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) adjacencyList.set(edge.source, []);
    adjacencyList.get(edge.source)!.push({ target: edge.target, label: edge.label as string || '' });
    // Also add reverse for bidirectional traversal
    if (!adjacencyList.has(edge.target)) adjacencyList.set(edge.target, []);
    adjacencyList.get(edge.target)!.push({ target: edge.source, label: edge.label as string || '' });
  });

  // Try to find a path to framework using BFS
  const visited = new Set<string>([startNodeId]);
  const queue: string[][] = [[startNodeId]];

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const currentNode = currentPath[currentPath.length - 1];

    if (currentNode.startsWith('framework-')) {
      return { path: currentPath, pathType: 'compliance' };
    }

    const neighbors = adjacencyList.get(currentNode) || [];
    for (const { target } of neighbors) {
      if (!visited.has(target)) {
        visited.add(target);
        queue.push([...currentPath, target]);
      }
    }
  }

  return { path, pathType: 'none' };
}

/**
 * Impact depth colors - closer nodes have more saturated colors
 */
export const impactDepthColors: Record<number, string> = {
  0: '#13715B', // Source - primary green
  1: '#3b82f6', // 1 hop - blue
  2: '#8b5cf6', // 2 hops - purple
  3: '#ec4899', // 3 hops - pink
  4: '#f97316', // 4 hops - orange
};

/**
 * Get the impact color for a given depth
 */
export function getImpactColor(depth: number): string {
  return impactDepthColors[Math.min(depth, 4)] || impactDepthColors[4];
}
