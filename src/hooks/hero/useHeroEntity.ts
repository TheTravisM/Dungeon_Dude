import { useEffect } from 'react';
import { Vector3 } from 'three';
import { createHero, world } from '../../game/ecs';
import type { Position } from '../../types';

/**
 * Owns the single hero ECS entity for the lifetime of the hero component.
 *
 * The effect is keyed on the spawn coordinates so a new floor (new spawn)
 * removes the previous entity before adding the next one. StrictMode mounts,
 * cleans up, and remounts, which leaves exactly one hero in the world.
 */
export function useHeroEntity(spawn: Position): void {
  const { x, y, z } = spawn;

  useEffect(() => {
    const entity = createHero(new Vector3(x, y, z));
    return () => {
      world.remove(entity);
    };
  }, [x, y, z]);
}
