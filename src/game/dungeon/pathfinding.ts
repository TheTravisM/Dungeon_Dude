import type { GridCell } from '../../types';

export type GridDirection = readonly [number, number];

/** Cardinal order used by default. Callers may rotate it for deterministic variety. */
export const CARDINAL_DIRECTIONS: readonly GridDirection[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export interface GridPathOptions {
  size: number;
  start: GridCell;
  goal: GridCell;
  /** Bounded predicate for cells the route may enter. */
  canEnter: (x: number, z: number) => boolean;
  directions?: readonly GridDirection[];
}

/**
 * Bounded breadth-first search over a square grid. The first shortest path is
 * returned using the supplied neighbour order, which makes route selection
 * deterministic without depending on object or Map iteration order.
 */
export function findGridPath({
  size,
  start,
  goal,
  canEnter,
  directions = CARDINAL_DIRECTIONS,
}: GridPathOptions): GridCell[] | null {
  const inBounds = (x: number, z: number) => x >= 0 && z >= 0 && x < size && z < size;
  if (!inBounds(start.x, start.z) || !inBounds(goal.x, goal.z)) return null;

  const index = (x: number, z: number) => z * size + x;
  const startIndex = index(start.x, start.z);
  const goalIndex = index(goal.x, goal.z);

  const visited = new Uint8Array(size * size);
  const parent = new Int32Array(size * size);
  parent.fill(-1);
  const queue = new Int32Array(size * size);
  let head = 0;
  let tail = 0;

  visited[startIndex] = 1;
  queue[tail++] = startIndex;

  while (head < tail) {
    const current = queue[head++];
    if (current === goalIndex) break;

    const x = current % size;
    const z = Math.floor(current / size);

    for (const [dx, dz] of directions) {
      const nx = x + dx;
      const nz = z + dz;
      if (!inBounds(nx, nz) || !canEnter(nx, nz)) continue;

      const neighbor = index(nx, nz);
      if (visited[neighbor] === 1) continue;

      visited[neighbor] = 1;
      parent[neighbor] = current;
      queue[tail++] = neighbor;
    }
  }

  if (visited[goalIndex] !== 1) return null;

  const path: GridCell[] = [];
  let current = goalIndex;
  while (current !== -1) {
    path.push({ x: current % size, z: Math.floor(current / size) });
    if (current === startIndex) break;
    current = parent[current];
  }
  return path.reverse();
}
