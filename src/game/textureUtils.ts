import * as THREE from 'three';
import type { SlabPoint } from './slabPattern';

export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export function createSurface(size: number): Surface | null {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  return { canvas, ctx };
}

export function tint(
  color: readonly [number, number, number],
  factor: number
): string {
  const channel = (value: number): number =>
    Math.max(0, Math.min(255, Math.round(value * factor)));
  return `rgb(${channel(color[0])}, ${channel(color[1])}, ${channel(color[2])})`;
}

export function tracePath(
  ctx: CanvasRenderingContext2D,
  points: SlabPoint[]
): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
}

export function configureTexture(
  texture: THREE.CanvasTexture,
  colorSpace?: THREE.ColorSpace
): THREE.CanvasTexture {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.anisotropy = 4;
  if (colorSpace) texture.colorSpace = colorSpace;
  texture.needsUpdate = true;
  return texture;
}
