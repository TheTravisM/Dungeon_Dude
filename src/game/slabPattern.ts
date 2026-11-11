export interface SlabPoint {
  x: number;
  y: number;
}

export interface Slab {
  points: SlabPoint[];
  tone: number;
  variation: number;
}

export const SLAB_COLS = 1;
export const SLAB_ROWS = 2;

/** Neutral slate tones. Per-cell instance color supplies the blue and purple. */
export const SLAB_PALETTE: ReadonlyArray<readonly [number, number, number]> = [
  [132, 136, 142],
  [118, 124, 134],
  [136, 138, 144],
];

const JITTER = 0.42;
const EDGE_JITTER = 0.16;
const INSET = 0.014;

function hash(x: number, y: number, seed: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function vertex(size: number, col: number, row: number): SlabPoint {
  const tileW = size / SLAB_COLS;
  const tileH = size / SLAB_ROWS;
  const jitterX =
    (hash(col % SLAB_COLS, row % SLAB_ROWS, 3) - 0.5) * tileW * JITTER;
  const jitterY =
    (hash(col % SLAB_COLS, row % SLAB_ROWS, 4) - 0.5) * tileH * JITTER;

  return {
    x: col === 0 || col === SLAB_COLS ? col * tileW : col * tileW + jitterX,
    y: row === 0 || row === SLAB_ROWS ? row * tileH : row * tileH + jitterY,
  };
}

/**
 * Midpoint of a shared grid edge, pushed perpendicular by a hash so slab
 * outlines look chipped instead of rectangular. Boundary edges stay straight so
 * the texture still tiles without a seam.
 */
function edgeMidpoint(
  size: number,
  col: number,
  row: number,
  horizontal: boolean
): SlabPoint {
  const tileW = size / SLAB_COLS;
  const tileH = size / SLAB_ROWS;
  const boundary = horizontal
    ? row === 0 || row === SLAB_ROWS
    : col === 0 || col === SLAB_COLS;
  const push = boundary
    ? 0
    : (hash(col, row, horizontal ? 5 : 6) - 0.5) *
      (horizontal ? tileH : tileW) *
      EDGE_JITTER;
  const slide = boundary
    ? 0
    : (hash(col, row, horizontal ? 7 : 8) - 0.5) *
      (horizontal ? tileW : tileH) *
      EDGE_JITTER;

  return horizontal
    ? { x: (col + 0.5) * tileW + slide, y: row * tileH + push }
    : { x: col * tileW + push, y: (row + 0.5) * tileH + slide };
}

/** Shrinks a slab toward its centroid to open a mortar gap around it. */
export function insetSlab(points: SlabPoint[], amount: number): SlabPoint[] {
  const cx = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point.y, 0) / points.length;

  return points.map((point) => {
    const dx = point.x - cx;
    const dy = point.y - cy;
    const length = Math.hypot(dx, dy) || 1;
    return {
      x: point.x - (dx / length) * amount,
      y: point.y - (dy / length) * amount,
    };
  });
}

/**
 * Builds a 2 by 2 grid of chipped stone slabs in pixel space. The same
 * deterministic layout is reused for the albedo, normal, and roughness maps.
 */
export function createSlabs(size: number): Slab[] {
  const slabs: Slab[] = [];

  for (let row = 0; row < SLAB_ROWS; row++) {
    for (let col = 0; col < SLAB_COLS; col++) {
      const points = insetSlab(
        [
          vertex(size, col, row),
          edgeMidpoint(size, col, row, true),
          vertex(size, col + 1, row),
          edgeMidpoint(size, col + 1, row, false),
          vertex(size, col + 1, row + 1),
          edgeMidpoint(size, col, row + 1, true),
          vertex(size, col, row + 1),
          edgeMidpoint(size, col, row, false),
        ],
        size * INSET
      );

      slabs.push({
        points,
        // Cycle the palette instead of hashing it, so every wall face shows
        // slate, blue, and purple stone rather than one dominant hue.
        tone: (col + row * 2) % SLAB_PALETTE.length,
        variation: hash(col, row, 2),
      });
    }
  }

  return slabs;
}
