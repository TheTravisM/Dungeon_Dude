import createGraph from 'ngraph.graph';
import type { Graph } from 'ngraph.graph';
import { aStar } from 'ngraph.path';
import type { DungeonLayout, GridCell } from '../types';
import { CARDINAL_DIRECTIONS } from './dungeon/pathfinding';

/**
 * Navigation graph over the dungeon's floor cells.
 *
 * The graph is built once per layout and is deterministic: nodes and links
 * are inserted in `floorCells` order, so the same layout always yields the
 * same routes. Node ids are `"x,z"` strings, so a cell's id is stable and
 * can be reconstructed from coordinates alone.
 */

/** Node ids are `"x,z"` strings; one per floor cell. */
const cellId = (x: number, z: number): string => `${Math.round(x)},${Math.round(z)}`;

export interface NavGraph {
  /** The underlying graph, exposed for validation and debug tooling. */
  graph: Graph<GridCell>;
  /**
   * Shortest 4-way route between two floor cells, ordered start -> target.
   * Returns an empty array when either cell is not floor or no route exists.
   */
  findPath(startX: number, startZ: number, targetX: number, targetZ: number): GridCell[];
}

/**
 * Builds the navigation matrix for a layout. An invalid layout still returns
 * a usable, empty graph so callers never have to guard against a partial
 * result while a seed is being regenerated.
 */
export function buildNavGraph(layout: DungeonLayout): NavGraph {
  const graph = createGraph<GridCell>();
  const floorIds = new Set<string>();

  if (!layout || !layout.floorCells) {
    return { graph, findPath: () => [] };
  }

  // 1. One node per floor cell, keyed by its "x,z" id. Coordinates are
  //    rounded so fractional cell data cannot create mismatched ids.
  for (const cell of layout.floorCells) {
    const x = Math.round(cell.x);
    const z = Math.round(cell.z);
    const id = cellId(x, z);
    floorIds.add(id);
    graph.addNode(id, { x, z });
  }

  // 2. One directed link per 4-way adjacency. Every cell probes all four
  //    neighbours, so each adjacency gets a link in each direction and the
  //    search works regardless of link orientation.
  for (const cell of layout.floorCells) {
    const x = Math.round(cell.x);
    const z = Math.round(cell.z);
    const id = cellId(x, z);
    for (const [dx, dz] of CARDINAL_DIRECTIONS) {
      const neighborId = cellId(x + dx, z + dz);
      if (floorIds.has(neighborId)) graph.addLink(id, neighborId);
    }
  }

  const pathfinder = aStar(graph, {
    distance(fromNode, toNode) {
      return Math.abs(fromNode.data.x - toNode.data.x) + Math.abs(fromNode.data.z - toNode.data.z);
    },
  });

  return {
    graph,
    findPath: (startX, startZ, targetX, targetZ) => {
      const startId = cellId(startX, startZ);
      const targetId = cellId(targetX, targetZ);
      // aStar throws for ids that are not in the graph, so guard first.
      if (!floorIds.has(startId) || !floorIds.has(targetId)) return [];
      const path = pathfinder.find(startId, targetId);
      // The path is rebuilt goal -> start, so reverse it to start -> goal.
      return path.map((node) => node.data).reverse();
    },
  };
}

/** True when the coordinate resolves to a walkable node in the graph. */
export function validateNode(graph: Graph<GridCell>, x: number, z: number): boolean {
  return graph.getNode(cellId(x, z)) !== undefined;
}
