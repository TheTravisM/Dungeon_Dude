# Step: Procedural PBR Stone Wall Textures

**Goal:** Replace flat-colored wall materials with runtime-generated procedural PBR textures featuring gray, purple, and blue stone blocks, paired with a matching bump map to make torchlight bounce naturally off mortar joints.

## 1. Create Texture Utility: `src/game/textures.ts`
Create this new utility file to generate cached stone and bump textures entirely in code using an HTML5 Canvas, ensuring zero load-time lag or external asset dependencies.

```typescript
import * as THREE from 'three';

export function createProceduralStoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Base dark mortar background
  ctx.fillStyle = '#15181e';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const cols = 8;
  const tileH = 512 / rows;
  const tileW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (tileW / 2);
    for (let c = -1; c < cols + 1; c++) {
      const x = c * tileW + offset;
      const y = r * tileH;

      // Blend gray, mystic purple, and midnight blue tones
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        ctx.fillStyle = '#323746'; // Cool Slate Gray
      } else if (colorChoice < 0.7) {
        ctx.fillStyle = '#2b263d'; // Deep Mystic Purple
      } else {
        ctx.fillStyle = '#222d3d'; // Dark Midnight Blue
      }

      // Draw stone block with mortar gap
      ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4);

      // Add surface noise speckles
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let i = 0; i < 4; i++) {
        const nx = x + Math.random() * tileW;
        const ny = y + Math.random() * tileH;
        ctx.fillRect(nx, ny, 3, 3);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

export function createProceduralBumpTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Mortar grooves (black)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 256, 256);

  const rows = 8;
  const cols = 8;
  const tileH = 256 / rows;
  const tileW = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (tileW / 2);
    for (let c = -1; c < cols + 1; c++) {
      const x = c * tileW + offset;
      const y = r * tileH;

      // Raised stone surface (light gray)
      ctx.fillStyle = '#b0b0b0';
      ctx.fillRect(x + 3, y + 3, tileW - 6, tileH - 6);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}
```

## 2. Update Wall Rendering Component (e.g., `src/game/Dungeon.tsx`)
Update your wall meshes to memoize and apply these procedural textures to a `meshStandardMaterial`.

### Required Logic:
- Import `useMemo` from React.
- Import `createProceduralStoneTexture` and `createProceduralBumpTexture` from `./textures`.
- Inside your wall mesh component, memoize the textures and pass them into `<meshStandardMaterial>` with a `bumpScale` of 0.04 and `roughness` of 0.55 so torchlight catches the stone edges cleanly.

```typescript
import { useMemo } from 'react';
import { createProceduralStoneTexture, createProceduralBumpTexture } from './textures';

// Inside your Wall component:
const [stoneMap, bumpMap] = useMemo(() => [
  createProceduralStoneTexture(),
  createProceduralBumpTexture()
], []);

// Inside JSX return for walls:
// <meshStandardMaterial map={stoneMap} bumpMap={bumpMap} bumpScale={0.04} roughness={0.55} />
```

## Execution Constraints
- Do not use external image links or heavy assets.
- Ensure textures are memoized so they do not regenerate on every frame render.
- Strictly avoid em dashes in code comments or text.