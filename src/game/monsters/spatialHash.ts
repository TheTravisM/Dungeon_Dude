export interface SpatialHash<T> {
  clear(): void;
  insert(item: T, x: number, z: number): void;
  /** Items within `radius` of (x, z), Euclidean, boundary inclusive. Fills and returns `out`. */
  queryRadius(x: number, z: number, radius: number, out: T[]): T[];
  /** Closest item within `radius`, ties to the earliest inserted, or null. */
  nearest(x: number, z: number, radius: number): T | null;
  readonly size: number;
}

function cellKey(cx: number, cz: number): number {
  return (cx + 512) * 1024 + (cz + 512);
}

/**
 * Uniform-grid proximity index. Buckets hold indices into parallel item and
 * coordinate arrays, so a steady-state rebuild (clear + insert) allocates
 * nothing and never mutates the stored items.
 */
export function createSpatialHash<T>(cellSize = 2): SpatialHash<T> {
  const buckets = new Map<number, number[]>();
  const items: T[] = [];
  const xs: number[] = [];
  const zs: number[] = [];
  const found: number[] = [];

  return {
    clear() {
      for (const bucket of buckets.values()) bucket.length = 0;
      items.length = 0;
      xs.length = 0;
      zs.length = 0;
      found.length = 0;
    },

    insert(item, x, z) {
      const index = items.length;
      items.push(item);
      xs.push(x);
      zs.push(z);

      const key = cellKey(Math.floor(x / cellSize), Math.floor(z / cellSize));
      const bucket = buckets.get(key);
      if (bucket) bucket.push(index);
      else buckets.set(key, [index]);
    },

    queryRadius(x, z, radius, out) {
      out.length = 0;
      if (!(radius > 0) || !Number.isFinite(radius)) return out;

      const minX = Math.floor((x - radius) / cellSize);
      const maxX = Math.floor((x + radius) / cellSize);
      const minZ = Math.floor((z - radius) / cellSize);
      const maxZ = Math.floor((z + radius) / cellSize);
      const radiusSq = radius * radius;

      found.length = 0;
      for (let cx = minX; cx <= maxX; cx++) {
        for (let cz = minZ; cz <= maxZ; cz++) {
          const bucket = buckets.get(cellKey(cx, cz));
          if (!bucket) continue;
          for (const index of bucket) {
            const dx = xs[index] - x;
            const dz = zs[index] - z;
            if (dx * dx + dz * dz <= radiusSq) found.push(index);
          }
        }
      }

      found.sort((a, b) => a - b);
      for (const index of found) out.push(items[index]);
      return out;
    },

    nearest(x, z, radius) {
      if (!(radius > 0) || !Number.isFinite(radius)) return null;

      const minX = Math.floor((x - radius) / cellSize);
      const maxX = Math.floor((x + radius) / cellSize);
      const minZ = Math.floor((z - radius) / cellSize);
      const maxZ = Math.floor((z + radius) / cellSize);
      const radiusSq = radius * radius;

      let bestIndex = -1;
      let bestSq = Infinity;

      for (let cx = minX; cx <= maxX; cx++) {
        for (let cz = minZ; cz <= maxZ; cz++) {
          const bucket = buckets.get(cellKey(cx, cz));
          if (!bucket) continue;
          for (const index of bucket) {
            const dx = xs[index] - x;
            const dz = zs[index] - z;
            const distanceSq = dx * dx + dz * dz;
            if (distanceSq > radiusSq) continue;
            if (
              distanceSq < bestSq ||
              (distanceSq === bestSq && index < bestIndex)
            ) {
              bestSq = distanceSq;
              bestIndex = index;
            }
          }
        }
      }

      return bestIndex === -1 ? null : items[bestIndex];
    },

    get size() {
      return items.length;
    },
  };
}
