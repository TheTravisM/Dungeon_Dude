import { CanvasTexture, SRGBColorSpace } from 'three';

const BLOB_SIZE = 128;

/** One radial gradient texture shared by the hero and every monster. */
let sharedTexture: CanvasTexture | null = null;

export function getBlobTexture(): CanvasTexture | null {
  if (sharedTexture) return sharedTexture;
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = BLOB_SIZE;
  canvas.height = BLOB_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const center = BLOB_SIZE / 2;
  const gradient = context.createRadialGradient(
    center,
    center,
    BLOB_SIZE * 0.04,
    center,
    center,
    center
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  gradient.addColorStop(0.45, 'rgba(0, 0, 0, 0.55)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, BLOB_SIZE, BLOB_SIZE);

  sharedTexture = new CanvasTexture(canvas);
  sharedTexture.colorSpace = SRGBColorSpace;
  return sharedTexture;
}
