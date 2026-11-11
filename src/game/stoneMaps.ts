import * as THREE from 'three';
import { createSlabs, insetSlab } from './slabPattern';
import { configureTexture, createSurface, tracePath } from './textureUtils';

/**
 * Shared height field for the normal and roughness maps. Mortar stays black,
 * while each slab gets a raised face and a handful of small pits so the surface
 * reads as rough stone without any extra geometry.
 */
export function createHeightField(size: number): Uint8ClampedArray | null {
  const surface = createSurface(size);
  if (!surface) return null;

  const { ctx } = surface;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  for (const slab of createSlabs(size)) {
    const shade = 150 + Math.round(slab.variation * 60);
    tracePath(ctx, slab.points);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fill();

    ctx.save();
    tracePath(ctx, insetSlab(slab.points, size * 0.018));
    ctx.fillStyle = `rgb(${shade + 16}, ${shade + 16}, ${shade + 16})`;
    ctx.fill();
    ctx.restore();

    ctx.save();
    tracePath(ctx, slab.points);
    ctx.clip();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let i = 0; i < 30; i++) {
      const x = 20 + Math.random() * (size - 40);
      const y = 20 + Math.random() * (size - 40);
      ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2);
    }

    // Chisel strokes and cracks give the normal map a rough, hand-cut surface.
    const xs = slab.points.map((point) => point.x);
    const ys = slab.points.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    for (let i = 0; i < 14; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const length = 3 + Math.random() * 10;
      const angle = (Math.random() - 0.5) * 1.4;

      ctx.strokeStyle =
        Math.random() < 0.6 ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const cx = minX + (0.25 + slab.variation * 0.5) * (maxX - minX);
    const cy = minY + 0.15 * (maxY - minY);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (Math.random() - 0.5) * (maxX - minX) * 0.3, cy + (maxY - minY) * 0.4);
    ctx.lineTo(cx + (Math.random() - 0.5) * (maxX - minX) * 0.4, cy + (maxY - minY) * 0.8);
    ctx.stroke();
    ctx.restore();
  }

  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;

  // Fine grain lifts micro detail into the normal map without extra geometry.
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.round((Math.random() - 0.5) * 10);
    data[i] = data[i] + noise;
    data[i + 1] = data[i + 1] + noise;
    data[i + 2] = data[i + 2] + noise;
  }

  return data;
}

/** Converts the height field to a seam-safe tangent-space normal map. */
export function createNormalMap(
  height: Uint8ClampedArray,
  size: number
): THREE.CanvasTexture | null {
  const surface = createSurface(size);
  if (!surface) return null;

  const { canvas, ctx } = surface;
  const image = ctx.createImageData(size, size);
  const strength = 2.0;

  for (let y = 0; y < size; y++) {
    const row = y * size;
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;

    for (let x = 0; x < size; x++) {
      const left = height[row + ((x - 1 + size) % size)] / 255;
      const right = height[row + ((x + 1) % size)] / 255;
      const above = height[up + x] / 255;
      const below = height[down + x] / 255;

      const nx = -(right - left) * strength;
      const ny = (below - above) * strength;
      const nz = 1;
      const length = Math.hypot(nx, ny, nz);
      const index = (row + x) * 4;

      image.data[index] = Math.round((nx / length) * 127.5 + 127.5);
      image.data[index + 1] = Math.round((ny / length) * 127.5 + 127.5);
      image.data[index + 2] = Math.round((nz / length) * 127.5 + 127.5);
      image.data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture);
}

/** Mortar is matte; raised slab faces are smoother so their edges catch light. */
export function createRoughnessMap(
  height: Uint8ClampedArray,
  size: number
): THREE.CanvasTexture | null {
  const surface = createSurface(size);
  if (!surface) return null;

  const { canvas, ctx } = surface;
  const image = ctx.createImageData(size, size);

  for (let i = 0; i < height.length; i += 4) {
    const value = Math.round(
      THREE.MathUtils.lerp(0.94, 0.62, height[i] / 255) * 255
    );
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  return configureTexture(texture);
}
