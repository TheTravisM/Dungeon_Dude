import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { hashCell } from '../../game/instancing/seededRandom';

const CHIP_AMPLITUDE = 0.018;

/** Stable 3D hash built from the existing cell hash so no Math.random leaks in. */
function hash3(x: number, y: number, z: number, seed: number): number {
  return hashCell(
    Math.round(x * 1000) + seed,
    Math.round(z * 1000),
    Math.round(y * 1000) >>> 0
  );
}

/**
 * Beveled wall block with deterministic chips on its vertical faces.
 *
 * The blueprint prefers a library chipped stone GLB. No licensed block was
 * supplied, so this is the documented fallback: rounded bevels soften every
 * edge and a seeded vertex nudge breaks the perfect 90 degree silhouette
 * without changing the footprint enough to open a gap between cells. Vertices
 * are keyed by their quantized position so duplicated face vertices move
 * together and the mesh cannot crack.
 */
export function createChippedWallGeometry(
  thickness: number,
  height: number,
  seed: number
): RoundedBoxGeometry {
  const geometry = new RoundedBoxGeometry(thickness, height, thickness, 2, 0.05);
  const position = geometry.getAttribute('position');
  const offsets = new Map<string, [number, number, number]>();

  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const key = `${x.toFixed(4)}|${y.toFixed(4)}|${z.toFixed(4)}`;

    let offset = offsets.get(key);
    if (!offset) {
      const h = hash3(x, y, z, seed);
      // Two independent pseudo-random values in [-1, 1].
      const a = ((h & 0xffff) / 0xffff) * 2 - 1;
      const b = (((h >>> 16) & 0xffff) / 0xffff) * 2 - 1;
      offset = [a * CHIP_AMPLITUDE, 0, b * CHIP_AMPLITUDE];
      offsets.set(key, offset);
    }

    // Leave the bottom edge alone so every block still sits on the plinth.
    const bottom = y <= -height / 2 + 0.001;
    position.setXYZ(
      index,
      x + offset[0],
      bottom ? y : y + offset[1],
      z + offset[2]
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
