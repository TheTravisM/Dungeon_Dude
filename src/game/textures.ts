import * as THREE from 'three';

const STONE_SIZE = 512;
const BUMP_SIZE = 256;
const ROWS = 8;
const COLS = 8;

interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

function createSurface(size: number): Surface | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  return { canvas, ctx };
}

/**
 * Visits every stone block in an offset brick grid. Rows alternate by half a
 * tile, and one extra column on each side keeps the pattern seamless when the
 * texture repeats.
 */
function forEachBlock(
  size: number,
  gap: number,
  paint: (x: number, y: number, width: number, height: number) => void
): void {
  const tileH = size / ROWS;
  const tileW = size / COLS;

  for (let row = 0; row < ROWS; row++) {
    const offset = (row % 2) * (tileW / 2);
    for (let col = -1; col < COLS + 1; col++) {
      const x = col * tileW + offset;
      const y = row * tileH;
      paint(x + gap, y + gap, tileW - gap * 2, tileH - gap * 2);
    }
  }
}

function configureTexture(
  texture: THREE.CanvasTexture,
  colorSpace?: THREE.ColorSpace
): THREE.CanvasTexture {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  if (colorSpace) texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates the wall albedo map. Cool slate, deep purple, and midnight blue
 * blocks share a dark mortar bed. Per-block highlights, shadowed bottom edges,
 * and speckles keep torchlight from reading the surface as flat color.
 */
export function createProceduralStoneTexture(): THREE.CanvasTexture | null {
  const surface = createSurface(STONE_SIZE);
  if (!surface) return null;

  const { canvas, ctx } = surface;

  ctx.fillStyle = '#15181e';
  ctx.fillRect(0, 0, STONE_SIZE, STONE_SIZE);

  forEachBlock(STONE_SIZE, 2, (x, y, width, height) => {
    const choice = Math.random();
    if (choice < 0.4) {
      ctx.fillStyle = '#323746';
    } else if (choice < 0.7) {
      ctx.fillStyle = '#2b263d';
    } else {
      ctx.fillStyle = '#222d3d';
    }
    ctx.fillRect(x, y, width, height);

    // A faint top highlight and dark lower edge give each block relief even
    // before the bump map is applied.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(x, y, width, 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x, y + height - 2, width, 2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = 0; i < 4; i++) {
      const nx = x + Math.random() * width;
      const ny = y + Math.random() * height;
      ctx.fillRect(nx, ny, 3, 3);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, THREE.SRGBColorSpace);
}

/**
 * Generates the height map used as a bump map. Mortar joints stay black while
 * each block receives a slightly different gray level and small dark pits, so
 * the bump catches torchlight with a natural, uneven stone surface.
 */
export function createProceduralBumpTexture(): THREE.CanvasTexture | null {
  const surface = createSurface(BUMP_SIZE);
  if (!surface) return null;

  const { canvas, ctx } = surface;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, BUMP_SIZE, BUMP_SIZE);

  forEachBlock(BUMP_SIZE, 1, (x, y, width, height) => {
    const shade = 140 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let i = 0; i < 6; i++) {
      const nx = x + Math.random() * width;
      const ny = y + Math.random() * height;
      ctx.fillRect(nx, ny, 2, 2);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture);
}
