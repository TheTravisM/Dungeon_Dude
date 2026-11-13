import * as THREE from 'three';
import type { DecalKind } from '../../../game/dungeon/decor';
import { createSurface } from '../../../game/textureUtils';

/**
 * Paints one transparent canvas per decal family. A single texture per family
 * lets every moss patch, puddle, and crack share one instanced draw call while
 * still looking hand-scattered.
 */
export function createDecalTexture(kind: DecalKind): THREE.CanvasTexture | null {
  const surface = createSurface(128);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const size = 128;
  ctx.clearRect(0, 0, size, size);

  if (kind === 'moss') {
    const colors = ['#3b5b3a', '#4f7444', '#2d4730', '#6b8a4a'];
    for (let i = 0; i < 34; i++) {
      const x = size / 2 + (Math.random() - 0.5) * size * 0.8;
      const y = size / 2 + (Math.random() - 0.5) * size * 0.8;
      const radius = 4 + Math.random() * 15;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, colors[i % colors.length]);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  } else if (kind === 'puddle') {
    const gradient = ctx.createRadialGradient(64, 60, 4, 64, 64, 58);
    gradient.addColorStop(0, 'rgba(92, 124, 148, 0.72)');
    gradient.addColorStop(0.55, 'rgba(42, 68, 88, 0.62)');
    gradient.addColorStop(1, 'rgba(16, 28, 40, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(64, 64, 58, 44, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(170, 200, 220, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(54, 52, 24, 13, -0.4, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(8, 11, 16, 0.72)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.4;
    let x = 18 + Math.random() * 20;
    let y = 20 + Math.random() * 20;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < 8; i++) {
      x += 6 + Math.random() * 12;
      y += (Math.random() - 0.45) * 16;
      ctx.lineTo(x, y);
      if (i === 4) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(130, 145, 165, 0.14)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const sx = 10 + Math.random() * 108;
      const sy = 10 + Math.random() * 108;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 4 + Math.random() * 8, sy + (Math.random() - 0.5) * 5);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
