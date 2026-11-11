import { describe, expect, it } from 'vitest';
import { World } from 'miniplex';
import * as THREE from 'three';
import { createHeroTree, type HeroTreeEvents } from '../src/game/ai/HeroTree';
import { gridToWorld } from '../src/game/dungeon/constants';
import { buildNavGraph } from '../src/game/pathfinding';
import type { DungeonLayout, Entity, GridCell } from '../src/types';

/**
 * The tree is fully Node-testable: a real miniplex world, the real nav
 * graph, and recording event callbacks in place of the store. Each test
 * builds its own world (never the shared ECS world) so tests stay
 * independent.
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
  time: number;
}

/** Half a tile per frame: small enough to land exactly on node centers. */
const STEP = 0.5;

/** Fixed simulated frame duration, matching the game's 1/60 s physics step. */
const FRAME_DELTA = 1 / 60;

/** Mirrors Hero.tsx's blackboard clock updates before stepping the tree. */
function syncClock(sim: Sim) {
  sim.time += FRAME_DELTA;
  sim.ai.blackboard.position.copy(sim.pos);
  sim.ai.blackboard.delta = FRAME_DELTA;
  sim.ai.blackboard.elapsedTime = sim.time;
}

/**
 * One simulated frame, mirroring Hero.tsx: copy the body position into the
 * blackboard, step the tree, then move along outputDirection.
 */
function frame(sim: Sim) {
  syncClock(sim);
  sim.ai.tree.step();
  const dir = sim.ai.blackboard.outputDirection;
  if (dir.lengthSq() > 0) sim.pos.addScaledVector(dir, STEP);
}

/** Steps the tree without moving the body, simulating a wall stall. */
function stallFrame(sim: Sim) {
  syncClock(sim);
  sim.ai.tree.step();
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

/** No-op events for tests that do not exercise the tree's side effects. */
const noopEvents: HeroTreeEvents = {
  onKeyPickedUp: () => {},
  onDescend: () => {},
};

function makeSim(
  cells: GridCell[],
  world: World<Entity>,
  seed: number,
  at: GridCell,
  events: HeroTreeEvents
): Sim {
  const nav = buildNavGraph({ floorCells: cells } as DungeonLayout);
  const ai = createHeroTree(nav, cells, world, seed, events);
  return { ai, pos: cellWorld(at.x, at.z), time: 0 };
}

describe('Hero objective tree', () => {
  it('wanders when no POIs exist', () => {
    const world = new World<Entity>();
    const cells = corridor(0, 4);
    const sim = makeSim(cells, world, 1337, { x: 0, z: 0 }, noopEvents);
    const start = cellWorld(0, 0);

    let maxDistance = 0;
    for (let i = 0; i < 20; i++) {
      frame(sim);
      maxDistance = Math.max(maxDistance, sim.pos.distanceTo(start));
    }

    // The hero must have left the spawn cell at some point in 20 frames.
    expect(maxDistance).toBeGreaterThan(0);
  });

  it('is deterministic: the same seed wanders the same way', () => {
    const cells = corridor(0, 8);
    const a = makeSim(cells, new World<Entity>(), 1337, { x: 0, z: 0 }, noopEvents);
    const b = makeSim(cells, new World<Entity>(), 1337, { x: 0, z: 0 }, noopEvents);

    for (let i = 0; i < 30; i++) {
      frame(a);
      frame(b);
    }

    expect(a.pos).toEqual(b.pos);
  });

  it('picks up the key on contact and fires onKeyPickedUp', () => {
    let keyPickedUp = 0;
    const world = new World<Entity>();
    const cells = corridor(0, 3);
    const key = spawnPoi(world, 'key', 2, 0);
    const sim = makeSim(cells, world, 1337, { x: 2, z: 0 }, {
      onKeyPickedUp: () => {
        keyPickedUp += 1;
      },
      onDescend: () => {},
    });

    frame(sim);

    expect(sim.ai.blackboard.hasKeyState).toBe(true);
    expect(key.isActive).toBe(false);
    expect(keyPickedUp).toBe(1);
  });

  it('paths to the nearest key, not the first spawned one', () => {
    const world = new World<Entity>();
    const cells = corridor(0, 6);
    // Spawned first but far away: the old first-match behaviour would pick it.
    spawnPoi(world, 'key', 5, 0);
    const near = spawnPoi(world, 'key', 1, 0);
    const sim = makeSim(cells, world, 1337, { x: 0, z: 0 }, noopEvents);

    frame(sim);

    const path = sim.ai.blackboard.currentPath;
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 1, z: 0 });
    expect(near.isActive).toBe(true); // Not consumed until contact.
  });

  it('paths to the nearest stairs once the key is held', () => {
    const world = new World<Entity>();
    const cells = corridor(0, 6);
    spawnPoi(world, 'stairs', 5, 0);
    const near = spawnPoi(world, 'stairs', 1, 0);
    const sim = makeSim(cells, world, 1337, { x: 0, z: 0 }, noopEvents);
    sim.ai.blackboard.hasKeyState = true;

    frame(sim);

    const path = sim.ai.blackboard.currentPath;
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 1, z: 0 });
    expect(near.isActive).toBe(true); // Not consumed until contact.
  });

  it('throttles pathfinding requests to at most 4 Hz', () => {
    const cells = corridor(0, 8);
    const base = buildNavGraph({ floorCells: cells } as DungeonLayout);
    let pathCalls = 0;
    const nav = {
      graph: base.graph,
      findPath: (
        startX: number,
        startZ: number,
        targetX: number,
        targetZ: number
      ) => {
        pathCalls += 1;
        return base.findPath(startX, startZ, targetX, targetZ);
      },
    };
    const ai = createHeroTree(nav, cells, new World<Entity>(), 1337, noopEvents);
    const sim: Sim = { ai, pos: cellWorld(0, 0), time: 0 };

    // Force a pending destination on every frame. Only the first request may
    // reach A* inside the 0.25 s cooldown window.
    for (let i = 0; i < 10; i++) {
      syncClock(sim);
      ai.blackboard.currentPath = [];
      ai.tree.step();
    }

    expect(pathCalls).toBe(1);
  });

  it('recovers from a stalled route with a deterministic fallback', () => {
    const world = new World<Entity>();
    const cells = corridor(0, 4);
    const sim = makeSim(cells, world, 1337, { x: 2, z: 0 }, noopEvents);

    // Simulate a body pressed against a wall: a valid route exists, but the
    // position never advances.
    sim.ai.blackboard.position.copy(sim.pos);
    sim.ai.blackboard.currentPath = [
      { x: 3, z: 0 },
      { x: 4, z: 0 },
    ];
    sim.ai.blackboard.resetProgress();

    for (let i = 0; i < 91; i++) stallFrame(sim);

    expect(sim.ai.blackboard.activeState).toBe('Recovering');
    expect(sim.ai.blackboard.stuckTime).toBe(0);
    expect(sim.ai.blackboard.fallbackIndex).toBe(1);
    expect(sim.ai.blackboard.currentPath).toEqual([
      { x: 2, z: 0 },
      { x: 1, z: 0 },
      { x: 0, z: 0 },
    ]);
  });

  it('walks to the key, then descends at the stairs', () => {
    let keyPickedUp = 0;
    let descended = 0;
    const world = new World<Entity>();
    const cells = corridor(0, 4);
    const key = spawnPoi(world, 'key', 2, 0);
    const stairs = spawnPoi(world, 'stairs', 4, 0);
    const sim = makeSim(cells, world, 1337, { x: 0, z: 0 }, {
      onKeyPickedUp: () => {
        keyPickedUp += 1;
      },
      onDescend: () => {
        descended += 1;
      },
    });

    const finished = runUntil(sim, () => descended === 1);

    expect(finished).toBe(true);
    expect(keyPickedUp).toBe(1);
    expect(descended).toBe(1);
    expect(key.isActive).toBe(false);
    expect(stairs.isActive).toBe(false);
    expect(sim.pos.distanceTo(cellWorld(4, 0))).toBeLessThan(0.6);
  });
});