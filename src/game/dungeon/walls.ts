import type {
  DungeonWallCell,
  DungeonWallRun,
  GridCell,
  WallHeight,
} from '../../types';

export interface WallGenerationResult {
  wallCells: DungeonWallCell[];
  wallRuns: DungeonWallRun[];
}

const NONE = 0;
const LOW = 1;
const TALL = 2;
type WallValue = typeof NONE | typeof LOW | typeof TALL;

function heightFor(value: WallValue): WallHeight {
  return value === TALL ? 'tall' : 'low';
}

/**
 * Derives wall cells from the walkable floor and merges them into
 * non-overlapping two-dimensional rectangles. Walls are placed only on cells
 * that are not floor, so a corridor opening can never be blocked. The far
 * perimeter (x or z equal to zero) stays tall as the camera backdrop; near and
 * interior walls become low ledges.
 */
export function generateWalls(
  floorCells: readonly GridCell[],
  size: number
): WallGenerationResult {
  const index = (x: number, z: number) => z * size + x;
  const inBounds = (x: number, z: number) => x >= 0 && z >= 0 && x < size && z < size;
  const floorMask = new Uint8Array(size * size);
  const wallMask = new Uint8Array(size * size);

  for (const cell of floorCells) {
    if (inBounds(cell.x, cell.z)) floorMask[index(cell.x, cell.z)] = 1;
  }

  const setWall = (x: number, z: number) => {
    if (!inBounds(x, z)) return;
    const cellIndex = index(x, z);
    if (floorMask[cellIndex] === 1) return;
    wallMask[cellIndex] = x === 0 || z === 0 ? TALL : LOW;
  };

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  // Protect every exposed orthogonal edge of the walkable floor.
  for (const cell of floorCells) {
    for (const [dx, dz] of directions) setWall(cell.x + dx, cell.z + dz);
  }

  // Close the diorama silhouette even where the dungeon never reaches an edge.
  for (let offset = 0; offset < size; offset++) {
    setWall(0, offset);
    setWall(size - 1, offset);
    setWall(offset, 0);
    setWall(offset, size - 1);
  }

  const wallCells: DungeonWallCell[] = [];
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const value = wallMask[index(x, z)] as WallValue;
      if (value !== NONE) wallCells.push({ x, z, height: heightFor(value) });
    }
  }

  return { wallCells, wallRuns: mergeWallRuns(wallMask, size) };
}

/**
 * Greedy rectangle merge per height. Each wall cell belongs to exactly one run,
 * which keeps the collider set free of overlaps and corner gaps. Rectangles are
 * preferred over strips so long perimeter and room walls become a few cuboids.
 */
function mergeWallRuns(wallMask: Uint8Array, size: number): DungeonWallRun[] {
  const index = (x: number, z: number) => z * size + x;
  const used = new Uint8Array(size * size);
  const runs: DungeonWallRun[] = [];

  for (const value of [TALL, LOW] as const) {
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        if (wallMask[index(x, z)] !== value || used[index(x, z)] === 1) continue;

        let width = 1;
        while (
          x + width < size &&
          wallMask[index(x + width, z)] === value &&
          used[index(x + width, z)] === 0
        ) {
          width++;
        }

        let depth = 1;
        while (z + depth < size) {
          let rowMatches = true;
          for (let offsetX = x; offsetX < x + width; offsetX++) {
            const cellIndex = index(offsetX, z + depth);
            if (wallMask[cellIndex] !== value || used[cellIndex] === 1) {
              rowMatches = false;
              break;
            }
          }
          if (!rowMatches) break;
          depth++;
        }

        for (let offsetZ = z; offsetZ < z + depth; offsetZ++) {
          for (let offsetX = x; offsetX < x + width; offsetX++) {
            used[index(offsetX, offsetZ)] = 1;
          }
        }

        runs.push({ x, z, width, depth, height: heightFor(value) });
      }
    }
  }

  return runs;
}
