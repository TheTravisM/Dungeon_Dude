import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { DungeonLayout, MonsterArchetypeId } from '../../../types';
import { PHYSICS_TIME_STEP } from '../../constants';
import { FLOOR_TOP, gridToWorld, worldToGrid } from '../../dungeon/constants';
import { generateDungeon } from '../../dungeon/generateDungeon';
import { createMonster, world } from '../../ecs';
import { createWalkGrid } from '../../hero/navigation/walkGrid';
import { MONSTER_ARCHETYPES, MONSTER_ARCHETYPE_IDS } from '../archetypes';
import { monsterIndex } from '../monsterIndex';
import { createMonsterBrain } from './monsterBrain';

const TICK_MS = 200;
const STEPS_PER_TICK = Math.round(TICK_MS / (PHYSICS_TIME_STEP * 1000));
const SEEDS = Array.from({ length: 30 }, (_, index) => index + 1);

interface SimOptions {
  seed: number;
  archetype: MonsterArchetypeId;
  /** null = missing hero, 'far' = beyond every aggro range, else same-room tiles. */
  hero: number | 'far' | null;
  escape?: boolean;
}

interface SimResult {
  state: string | undefined;
  x: number;
  z: number;
  home: { x: number; z: number };
  attackStep: number | null;
  offGrid: boolean;
}

function pointOf(layout: DungeonLayout, cellX: number, cellZ: number) {
  return {
    x: gridToWorld(cellX, layout.size),
    z: gridToWorld(cellZ, layout.size),
  };
}

/** A same-room cell roughly `distance` tiles from the room center. */
function heroCell(layout: DungeonLayout, distance: number) {
  const center = layout.rooms[0].center;
  for (const cell of layout.floorCells) {
    const d = Math.hypot(cell.x - center.x, cell.z - center.z);
    if (d >= distance - 0.75 && d <= distance + 0.75) return cell;
  }
  return null;
}

function run(options: SimOptions, seconds: number): SimResult {
  const layout = generateDungeon(options.seed);
  const grid = createWalkGrid(layout);
  const center = layout.rooms[0].center;
  const home = pointOf(layout, center.x, center.z);

  let heroNow: { x: number; z: number } | null;
  if (options.hero === null) {
    heroNow = null;
  } else if (options.hero === 'far') {
    heroNow = { x: home.x + 100, z: home.z };
  } else {
    const cell = heroCell(layout, options.hero);
    heroNow = cell ? pointOf(layout, cell.x, cell.z) : null;
  }

  const entity = createMonster(
    new Vector3(home.x, FLOOR_TOP, home.z),
    options.archetype
  );
  const stats = MONSTER_ARCHETYPES[options.archetype];
  monsterIndex.clear();
  const brain = createMonsterBrain(
    entity,
    layout,
    grid,
    () => heroNow,
    options.seed ^ 0x1234
  );

  const farRoom = layout.rooms[layout.rooms.length - 1].center;
  const farPoint = pointOf(layout, farRoom.x, farRoom.z);
  const escapeDistance = Math.hypot(farPoint.x - home.x, farPoint.z - home.z);
  const escapePoint =
    escapeDistance > stats.aggroRange * 1.6 + 1
      ? farPoint
      : { x: home.x + 100, z: home.z };
  const direction = { x: 0, z: 0 };
  const stepDistance = stats.moveSpeed * PHYSICS_TIME_STEP;
  let attackStep: number | null = null;
  let offGrid = false;

  for (let step = 0; step < seconds * 60; step++) {
    if (step % STEPS_PER_TICK === 0) brain.tick(step * PHYSICS_TIME_STEP * 1000);

    if (entity.state === 'attack' && attackStep === null) {
      attackStep = step;
      if (options.escape) heroNow = escapePoint;
    }

    brain.desiredDirection(0, direction);
    const position = entity.position!;
    position.x += direction.x * stepDistance;
    position.z += direction.z * stepDistance;

    const cellX = worldToGrid(position.x, layout.size);
    const cellZ = worldToGrid(position.z, layout.size);
    if (!grid.isWalkable(cellX, cellZ)) {
      offGrid = true;
      break;
    }
  }

  const result: SimResult = {
    state: entity.state,
    x: entity.position!.x,
    z: entity.position!.z,
    home,
    attackStep,
    offGrid,
  };
  world.remove(entity);
  monsterIndex.clear();
  return result;
}

function distanceToHome(result: SimResult): number {
  return Math.hypot(result.x - result.home.x, result.z - result.home.z);
}

describe('createMonsterBrain', () => {
  it('reaches attack within 10 s for every seed and archetype', () => {
    for (const archetype of MONSTER_ARCHETYPE_IDS) {
      for (const seed of SEEDS) {
        const result = run({ seed, archetype, hero: 2.5 }, 10);
        expect(result.offGrid, `${archetype} seed ${seed} left the floor`).toBe(false);
        expect(result.attackStep, `${archetype} seed ${seed}`).not.toBeNull();
        expect(result.state).toBe('attack');
      }
    }
  });

  it('stays idle and still when the hero is far away', () => {
    for (const archetype of MONSTER_ARCHETYPE_IDS) {
      const result = run({ seed: 1, archetype, hero: 'far' }, 10);
      expect(result.state).toBe('idle');
      expect(distanceToHome(result)).toBeLessThan(1e-6);
    }
  });

  it('gives up and walks home after the hero escapes', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const result = run(
        { seed, archetype: 'skeleton', hero: 2.5, escape: true },
        25
      );
      expect(result.attackStep).not.toBeNull();
      expect(
        result.state,
        `seed ${seed} ended ${result.state} at ${distanceToHome(result)} from home`
      ).toBe('idle');
      expect(distanceToHome(result)).toBeLessThan(0.3);
    }
  });

  it('stays idle when the hero is missing', () => {
    for (const archetype of MONSTER_ARCHETYPE_IDS) {
      const result = run({ seed: 2, archetype, hero: null }, 10);
      expect(result.state).toBe('idle');
      expect(distanceToHome(result)).toBeLessThan(1e-6);
    }
  });

  it('is deterministic for the same seed', () => {
    for (const archetype of MONSTER_ARCHETYPE_IDS) {
      const first = run({ seed: 7, archetype, hero: 2.5 }, 10);
      const second = run({ seed: 7, archetype, hero: 2.5 }, 10);
      expect(second.x).toBe(first.x);
      expect(second.z).toBe(first.z);
      expect(second.state).toBe(first.state);
    }
  });
});
