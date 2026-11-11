/**
 * Stable 32-bit hash of an entity id. Used for seeded per-monster values such
 * as the brain RNG seed and the brain-tick phase, so two monsters never share a
 * schedule just because their ids have the same length.
 */
export function hashMonsterId(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index++) {
    hash = (Math.imul(hash, 31) + id.charCodeAt(index)) | 0;
  }
  return hash >>> 0;
}
