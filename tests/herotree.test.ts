import { describe, expect, it } from 'vitest';
import { World } from 'miniplex';
import * as THREE from 'three';
import { createHeroTree } from '../src/game/ai/HeroTree';
import { gridToWorld } from '../src/game/dungeon/constants';
import { buildNavGraph } from '../src/game/pathfinding';
import { useGameStore } from '../src/game/store';
import type { DungeonLayout, Entity, GridCell } from '../src/types';

/**
 * The tree is fully Node-testable: a real miniplex world, the real store,
 * and the real nav graph. Each test builds its own world (never the shared
 * ECS world) and resets the store singleton so tests stay independent.
 */

/** World-space center of a grid cell, matching the dungeon convention. */
function cellWorld(x: number, z: number, y = 0): THREE.Vector3 {
  return new THREE.Vector3(gridToWorld(x), y, gridToWorld(z));
}

/** A straight one-tile-wide corridor from xStart to xEnd (inclusive). */
function corridor(xStart: number, xEnd: number, z = 0): GridCell[] {
  const cells: GridCell[] = [];
  for (let x = xStart; x <= xEnd; x++) cells.push({ x, z });
  return cells;
}

interface Sim {
  ai: ReturnType<typeof createHeroTree>;
  pos: THREE.Vector3;
}

/** Half a tile per frame: small enough to land exactly on node centers. */
const STEP = 0.5;

/**
 * One simulated frame, mirroring Hero.tsx: copy the body position into the
 * blackboard, step the tree, then move along outputDirection.
 */
function frame(sim: Sim) {
  sim.ai.blackboard.position.copy(sim.pos);
  sim.ai.tree.step();
  const dir = sim.ai.blackboard.outputDirection;
  if (dir.lengthSq() > 0) sim.pos.addScaledVector(dir, STEP);
}

function runUntil(sim: Sim, done: () => boolean, maxFrames = 300): boolean {
  for (let i = 0; i < maxFrames; i++) {
    if (done()) return true;
    frame(sim);
  }
  return done();
}

function spawnPoi(world: World<Entity>, poiType: 'key' | 'stairs', x: number, z: number): Entity {
  return world.add({
    id: `poi-${poiType}-${x}-${z}`,
    poiType,
    position: cellWorld(x, z),
    isActive: true,
  });
}

function makeSim(cells: GridCell[], world: World<Entity>, seed: number, at: GridCell): Sim {
  const nav = buildNavGraph({ floorCells: cells } as DungeonLayout);
  const ai = createHeroTree(nav, cells, world, seed);
  return { ai, pos: cellWorld(at.x, at.z) };
}

function resetStore() {
  useGameStore.setState({ currentDepth: 1, hasKey: false, isAutoMode: true });
}

describe('Hero objective tree', () => {
  it('wanders when no POIs exist', () => {
    resetStore();
    const world = new World<Entity>();
    const cells = corridor(0, 4);
    const sim = makeSim(cells, world, 1337, { x: 0, z: 0 });
    const start = cellWorld(0, 0);

    for (let i = 0; i < 20; i++) frame(sim);

    // The hero must have left the spawn cell within 20 frames.
    expect(sim.pos.distanceTo(start)).toBeGreaterThan(0);
  });

  it('is deterministic: the same seed wanders the same way', () => {
    resetStore();
    const cells = corridor(0, 8);
    const a = makeSim(cells, new World<Entity>(), 1337, { x: 0, z: 0 });
    const b = makeSim(cells, new World<Entity>(), 1337, { x: 0, z: 0 });

    for (let i = 0; i < 30; i++) {
      frame(a);
      frame(b);
    }

    expect(a.pos).toEqual(b.pos);
  });

  it('picks up the key on contact and mirrors it into the store', () => {
    resetStore();
    const world = new World<Entity>();
    const cells = corridor(0, 3);
    const key = spawnPoi(world, 'key', 2, 0);
    const sim = makeSim(cells, world, 1337, { x: 2, z: 0 });

    frame(sim);

    expect(sim.ai.blackboard.hasKeyState).toBe(true);
    expect(key.isActive).toBe(false);
    expect(useGameStore.getState().hasKey).toBe(true);
  });

  it('paths to the nearest key, not the first spawned one', () => {
    resetStore();
    const world = new World<Entity>();
    const cells = corridor(0, 6);
    // Spawned first but far away: the old first-match behaviour would pick it.
    spawnPoi(world, 'key', 5, 0);
    const near = spawnPoi(world, 'key', 1, 0);
    const sim = makeSim(cells, world, 1337, { x: 0, z: 0 });

    frame(sim);

    const path = sim.ai.blackboard.currentPath;
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 1, z: 0 });
    expect(near.isActive).toBe(true); // Not consumed until contact.
  });

  it('paths to the nearest stairs once the key is held', () => {
    resetStore();
    const world = new World<Entity>();
    const cells = corridor(0, 6);
    spawnPoi(world, 'stairs', 5, 0);
    const near = spawnPoi(world, 'stairs', 1, 0);
    const sim = makeSim(cells, world, 1337, { x: 0, z: 0 });
    sim.ai.blackboard.hasKeyState = true;

    frame(sim);

    const path = sim.ai.blackboard.currentPath;
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 1, z: 0 });
    expect(near.isActive).toBe(true); // Not consumed until contact.
  });

  it('walks to the key, then descends at the stairs', () => {
    resetStore();
    const world = new World<Entity>();
    const cells = corridor(0, 4);
    const key = spawnPoi(world, 'key', 2, 0);
    const stairs = spawnPoi(world, 'stairs', 4, 0);
    const sim = makeSim(cells, world, 1337, { x: 0, z: 0 });

    const descended = runUntil(sim, () => useGameStore.getState().currentDepth === 2);

    expect(descended).toBe(true);
    expect(key.isActive).toBe(false);
    expect(stairs.isActive).toBe(false);
    // The key is consumed by the descent: the rebuilt tree starts keyless.
    expect(useGameStore.getState().hasKey).toBe(false);
    expect(sim.pos.distanceTo(cellWorld(4, 0))).toBeLessThan(0.6);
  });
});