import { useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { FLOOR_TOP, gridToWorld } from '../game/dungeon/constants';
import { createMonster, createPoi, world } from '../game/ecs';
import { planSpawns } from '../game/monsters/spawnPlan';
import type { DungeonLayout, Entity } from '../types';

interface LevelEntityState {
  monsters: Entity[];
  pois: Entity[];
}

const EMPTY: LevelEntityState = { monsters: [], pois: [] };

function cellPosition(layout: DungeonLayout, x: number, z: number): Vector3 {
  return new Vector3(
    gridToWorld(x, layout.size),
    FLOOR_TOP,
    gridToWorld(z, layout.size)
  );
}

/**
 * Owns the ECS entities for one floor. The effect is keyed on layout and depth,
 * so a new floor removes the previous entities before adding the next ones.
 * StrictMode's mount/unmount/mount cycle therefore leaves exactly one set.
 */
export function useLevelEntities(
  layout: DungeonLayout,
  depth: number
): LevelEntityState {
  const [entities, setEntities] = useState<LevelEntityState>(EMPTY);

  useEffect(() => {
    const plan = planSpawns(layout, depth);

    const monsters = plan.monsters.map((spawn) =>
      createMonster(
        cellPosition(layout, spawn.cell.x, spawn.cell.z),
        spawn.archetype,
        { depth, roomIndex: spawn.roomIndex }
      )
    );

    const pois = [
      createPoi(cellPosition(layout, plan.key.cell.x, plan.key.cell.z), 'key'),
      createPoi(
        cellPosition(layout, plan.stairs.cell.x, plan.stairs.cell.z),
        'stairs'
      ),
    ];

    setEntities({ monsters, pois });

    return () => {
      for (const monster of monsters) world.remove(monster);
      for (const poi of pois) world.remove(poi);
      setEntities(EMPTY);
    };
  }, [layout, depth]);

  return entities;
}
