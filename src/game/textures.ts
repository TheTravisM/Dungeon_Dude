import * as THREE from 'three';
import {
  createSlabs,
  insetSlab,
  SLAB_PALETTE,
} from './slabPattern';
import { createHeightField, createNormalMap, createRoughnessMap } from './stoneMaps';
import {
  configureTexture,
  createSurface,
  tint,
  tracePath,
} from './textureUtils';

const ALBEDO_SIZE = 512;
const MAP_SIZE = 256;

/** Bounds of a slab in pixels, used to place cracks and gradients. */
function bounds(points: ReadonlyArray<{ x: number; y: number }>) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/**
 * Cool slate, blue, and purple rough-hewn slabs over a dark mortar bed. Each
 * slab is drawn as a dark beveled rim with a lighter raised face, so edges hold
 * up against the normal map under low light.
 */
function createAlbedoTexture(): THREE.CanvasTexture | null {
  const surface = createSurface(ALBEDO_SIZE);
  if (!surface) return null;

  const { canvas, ctx } = surface;
  ctx.fillStyle = '#0c1017';
  ctx.fillRect(0, 0, ALBEDO_SIZE, ALBEDO_SIZE);

  for (const slab of createSlabs(ALBEDO_SIZE)) {
    const [r, g, b] = SLAB_PALETTE[slab.tone];
    const factor = 0.8 + slab.variation * 0.4;
    const { minX, minY, maxX, maxY } = bounds(slab.points);

    // Dark rim first, then the raised face inset inside it.
    const rim = ctx.createLinearGradient(minX, minY, maxX, maxY);
    rim.addColorStop(0, tint([r, g, b], factor * 0.98));
    rim.addColorStop(1, tint([r, g, b], factor * 0.72));
    tracePath(ctx, slab.points);
    ctx.fillStyle = rim;
    ctx.fill();

    const face = insetSlab(slab.points, ALBEDO_SIZE * 0.018);
    const grain = ctx.createLinearGradient(minX, minY, maxX, maxY);
    grain.addColorStop(0, tint([r, g, b], factor * 1.14));
    grain.addColorStop(0.55, tint([r, g, b], factor * 1.02));
    grain.addColorStop(1, tint([r, g, b], factor * 0.92));
    tracePath(ctx, face);
    ctx.fillStyle = grain;
    ctx.fill();

    // Weathering stays inside the slab so mortar lines stay clean.
    ctx.save();
    tracePath(ctx, face);
    ctx.clip();

    for (let i = 0; i < 5; i++) {
      const bx = minX + Math.random() * (maxX - minX);
      const by = minY + Math.random() * (maxY - minY);
      const radius = (0.12 + Math.random() * 0.22) * (maxX - minX);
      const blotch = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
      blotch.addColorStop(
        0,
        i % 2 === 0 ? 'rgba(18, 26, 38, 0.16)' : 'rgba(198, 208, 228, 0.07)'
      );
      blotch.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = blotch;
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    }

    ctx.strokeStyle = 'rgba(7, 10, 16, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const crackX = minX + (maxX - minX) * (0.2 + slab.variation * 0.5);
    const crackY = minY + (maxY - minY) * 0.2;
    ctx.moveTo(crackX, crackY);
    ctx.lineTo(
      crackX + (Math.random() - 0.5) * (maxX - minX) * 0.35,
      crackY + (maxY - minY) * 0.35
    );
    ctx.lineTo(
      crackX + (Math.random() - 0.5) * (maxX - minX) * 0.45,
      crackY + (maxY - minY) * 0.7
    );
    ctx.stroke();

    for (let i = 0; i < 18; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      ctx.fillStyle =
        Math.random() < 0.5 ? 'rgba(8, 12, 18, 0.22)' : 'rgba(190, 205, 225, 0.08)';
      ctx.fillRect(x, y, 2 + Math.random() * 4, 1 + Math.random() * 2);
    }
    ctx.restore();

    // Crisp seam line to separate neighbouring slabs.
    tracePath(ctx, slab.points);
    ctx.strokeStyle = 'rgba(5, 8, 13, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const image = ctx.getImageData(0, 0, ALBEDO_SIZE, ALBEDO_SIZE);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.round((Math.random() - 0.5) * 10);
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture, THREE.SRGBColorSpace);
}

export interface StoneTextures {
  albedo: THREE.CanvasTexture | null;
  normal: THREE.CanvasTexture | null;
  roughness: THREE.CanvasTexture | null;
}

/** Generates all wall maps from one deterministic slab layout. */
export function createProceduralStoneTextures(): StoneTextures {
  const height = createHeightField(MAP_SIZE);

  return {
    albedo: createAlbedoTexture(),
    normal: height ? createNormalMap(height, MAP_SIZE) : null,
    roughness: height ? createRoughnessMap(height, MAP_SIZE) : null,
  };
}
