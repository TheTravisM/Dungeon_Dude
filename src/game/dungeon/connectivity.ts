import type { GridCell } from '../../types';

/**
 * Bounded four-direction flood fill over the supplied floor cells. The helper
 * is intentionally independent of the generator so acceptance checks can prove
 * that a layout is walkable without duplicating traversal rules.
 */
export function isFullyConnected(
  cells: readonly GridCell[],
  size: number,
  start: GridCell
): boolean {
  if (cells.length === 0) return false;

  const index = (x: number, z: number) => z * size + x;
  const inBounds = (x: number, z: number) => x >= 0 && z >= 0 && x < size && z < size;
  const floor = new Set<number>();

  for (const cell of cells) {
    if (inBounds(cell.x, cell.z)) floor.add(index(cell.x, cell.z));
  }

  const startIndex = index(start.x, start.z);
  if (!inBounds(start.x, start.z) || !floor.has(startIndex)) return false;

  const seen = new Set<number>([startIndex]);
  const queue: number[] = [startIndex];
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const x = current % size;
    const z = Math.floor(current / size);

    for (const [dx, dz] of directions) {
      const nx = x + dx;
      const nz = z + dz;
      if (!inBounds(nx, nz)) continue;

      const neighbor = index(nx, nz);
      if (floor.has(neighbor) && !seen.has(neighbor)) {
        seen.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return seen.size === floor.size;
}
