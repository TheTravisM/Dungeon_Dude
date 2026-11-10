import createGraph from 'ngraph.graph';
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
const cellId = (x: number, z: number): string => `${x},${z}`;

export interface NavGraph {
  /**
   * Shortest 4-way route between two floor cells, ordered start -> target.
   * Returns an empty array when either cell is not floor or no route exists.
   */
  findPath(startX: number, startZ: number, targetX: number, targetZ: number): GridCell[];
}

export function buildNavGraph(layout: DungeonLayout): NavGraph {
  const graph = createGraph<GridCell>();
  const floorIds = new Set<string>();

  // 1. One node per floor cell, keyed by its "x,z" id.
  for (const cell of layout.floorCells) {
    const id = cellId(cell.x, cell.z);
    floorIds.add(id);
    graph.addNode(id, { x: cell.x, z: cell.z });
  }

  // 2. One directed link per 4-way adjacency. Every cell probes all four
  //    neighbours, so each adjacency gets a link in each direction and the
  //    search works regardless of link orientation.
  for (const cell of layout.floorCells) {
    const id = cellId(cell.x, cell.z);
    for (const [dx, dz] of CARDINAL_DIRECTIONS) {
      const neighborId = cellId(cell.x + dx, cell.z + dz);
      if (floorIds.has(neighborId)) graph.addLink(id, neighborId);
    }
  }

  const pathfinder = aStar(graph, {
    distance(fromNode, toNode) {
      return Math.abs(fromNode.data.x - toNode.data.x) + Math.abs(fromNode.data.z - toNode.data.z);
    },
  });

  return {
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