import type { GridCell } from '../../types';

/** An axis-aligned rectangle in zero-indexed grid coordinates. */
export interface GridRectangle {
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface MergedRectangle extends GridRectangle {
  /** The mask value this rectangle was merged from. */
  value: number;
}

/**
 * Greedily merges equal-valued cells into two-dimensional rectangles. The walk
 * is row-major and deterministic, so a seed always produces the same rectangle
 * list. Each cell is covered by exactly one rectangle, which keeps colliders
 * gap-free without creating one cuboid per tile.
 *
 * The shared helper is used for both floor collision and wall collision. Wall
 * rendering still uses per-tile instances, because stretched instances would
 * make the stone texture scale differently on long and short walls.
 */
export function mergeMaskRectangles(
  mask: Uint8Array,
  size: number,
  values: readonly number[]
): MergedRectangle[] {
  const used = new Uint8Array(mask.length);
  const rectangles: MergedRectangle[] = [];
  const index = (x: number, z: number) => z * size + x;

  for (const value of values) {
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const cellIndex = index(x, z);
        if (mask[cellIndex] !== value || used[cellIndex] === 1) continue;

        let width = 1;
        while (
          x + width < size &&
          mask[index(x + width, z)] === value &&
          used[index(x + width, z)] === 0
        ) {
          width++;
        }

        let depth = 1;
        while (z + depth < size) {
          let rowMatches = true;
          for (let offsetX = x; offsetX < x + width; offsetX++) {
            const rowIndex = index(offsetX, z + depth);
            if (mask[rowIndex] !== value || used[rowIndex] === 1) {
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

        rectangles.push({ x, z, width, depth, value });
      }
    }
  }

  return rectangles;
}

/** Builds a row-major mask from a list of grid cells. */
export function createCellMask(cells: readonly GridCell[], size: number): Uint8Array {
  const mask = new Uint8Array(size * size);
  for (const cell of cells) {
    if (cell.x < 0 || cell.z < 0 || cell.x >= size || cell.z >= size) continue;
    mask[cell.z * size + cell.x] = 1;
  }
  return mask;
}
