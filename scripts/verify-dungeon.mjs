/**
 * Dependency-free dungeon verification.
 *
 * Run from the repository root with `node scripts/verify-dungeon.mjs`.
 * The script compiles the pure dungeon modules with the installed TypeScript
 * package into the OS temp directory, runs deterministic layout checks, and
 * removes the temporary build. It never writes into the repository.
 */

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const tsc = require.resolve('typescript/bin/tsc');
const root = process.cwd();
const sources = [
  'src/game/dungeon/constants.ts',
  'src/game/dungeon/random.ts',
  'src/game/dungeon/rooms.ts',
  'src/game/dungeon/connectivity.ts',
  'src/game/dungeon/pathfinding.ts',
  'src/game/dungeon/corridors.ts',
  'src/game/dungeon/walls.ts',
  'src/game/dungeon/generateDungeon.ts',
];

const output = mkdtempSync(join(tmpdir(), 'dungeon-dude-verify-'));

function fail(message) {
  console.error('FAIL:', message);
  process.exitCode = 1;
}

try {
  execFileSync(
    process.execPath,
    [
      tsc,
      ...sources,
      '--outDir',
      output,
      '--module',
      'commonjs',
      '--target',
      'ES2020',
      '--skipLibCheck',
      '--strict',
    ],
    { cwd: root, stdio: 'inherit' }
  );

  const base = join(output, 'game', 'dungeon');
  const load = (name) => import(pathToFileURL(join(base, name)).href);
  const { generateDungeon } = await load('generateDungeon.js');
  const { carveCorridors } = await load('corridors.js');
  const { isFullyConnected } = await load('connectivity.js');
  const { createRandom } = await load('random.js');
  const { placeRooms } = await load('rooms.js');
  const { DUNGEON_SIZE, WALL_HEIGHT_LOW } = await load('constants.js');

  if (WALL_HEIGHT_LOW !== 0.6) fail(`expected low wall height 0.6, got ${WALL_HEIGHT_LOW}`);

  const SEEDS = 500;
  let checked = 0;
  let loops = 0;
  const roomCounts = new Map();
  let minWallRuns = Number.POSITIVE_INFINITY;
  let maxWallRuns = 0;

  for (let seed = 1; seed <= SEEDS; seed++) {
    const layout = generateDungeon(seed);
    const again = generateDungeon(seed);
    if (JSON.stringify(layout) !== JSON.stringify(again)) {
      fail(`seed ${seed}: layout is not deterministic`);
      continue;
    }

    if (layout.size !== DUNGEON_SIZE) {
      fail(`seed ${seed}: unexpected size ${layout.size}`);
    }

    const keys = layout.floorCells.map((cell) => `${cell.x},${cell.z}`);
    if (new Set(keys).size !== keys.length) {
      fail(`seed ${seed}: duplicate floor cells`);
    }

    for (let i = 0; i < layout.floorCells.length; i++) {
      const cell = layout.floorCells[i];
      if (cell.x < 0 || cell.z < 0 || cell.x >= layout.size || cell.z >= layout.size) {
        fail(`seed ${seed}: floor cell out of bounds at ${cell.x},${cell.z}`);
      }
      if (i > 0) {
        const previous = layout.floorCells[i - 1];
        if (cell.z < previous.z || (cell.z === previous.z && cell.x <= previous.x)) {
          fail(`seed ${seed}: floor cells are not in stable row-major order`);
          break;
        }
      }
    }

    if (!isFullyConnected(layout.floorCells, layout.size, layout.rooms[0].center)) {
      fail(`seed ${seed}: floor is not fully connected`);
    }

    const floorSet = new Set(keys);
    for (const room of layout.rooms) {
      if (!floorSet.has(`${room.center.x},${room.center.z}`)) {
        fail(`seed ${seed}: room center is not a floor cell`);
      }
    }

    if (layout.rooms.length < 4 || layout.rooms.length > 6) {
      fail(`seed ${seed}: room count ${layout.rooms.length} is outside 4 to 6`);
    }
    roomCounts.set(layout.rooms.length, (roomCounts.get(layout.rooms.length) || 0) + 1);

    const wallMap = new Map(
      layout.wallCells.map((cell) => [`${cell.x},${cell.z}`, cell.height])
    );
    for (const cell of layout.wallCells) {
      const key = `${cell.x},${cell.z}`;
      if (floorSet.has(key)) {
        fail(`seed ${seed}: wall cell ${key} overlaps floor`);
      }
      const expectedHeight = cell.x === 0 || cell.z === 0 ? 'tall' : 'low';
      if (cell.height !== expectedHeight) {
        fail(`seed ${seed}: wall cell ${key} has wrong cutaway height`);
      }
    }

    // Every exposed orthogonal floor edge and the full outer ring must be walled.
    for (const cell of layout.floorCells) {
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = cell.x + dx;
        const nz = cell.z + dz;
        if (nx < 0 || nz < 0 || nx >= layout.size || nz >= layout.size) continue;
        const key = `${nx},${nz}`;
        if (!floorSet.has(key) && !wallMap.has(key)) {
          fail(`seed ${seed}: exposed floor edge ${key} has no wall`);
        }
      }
    }
    for (let offset = 0; offset < layout.size; offset++) {
      for (const key of [
        `0,${offset}`,
        `${layout.size - 1},${offset}`,
        `${offset},0`,
        `${offset},${layout.size - 1}`,
      ]) {
        if (!wallMap.has(key)) fail(`seed ${seed}: outer ring cell ${key} has no wall`);
      }
    }

    // Each wall cell must be covered by exactly one correctly sized run.
    const covered = new Map();
    for (const run of layout.wallRuns) {
      if (
        run.width < 1 ||
        run.depth < 1 ||
        run.x < 0 ||
        run.z < 0 ||
        run.x + run.width > layout.size ||
        run.z + run.depth > layout.size
      ) {
        fail(`seed ${seed}: wall run is outside the grid`);
        continue;
      }
      if (run.height !== 'tall' && run.height !== 'low') {
        fail(`seed ${seed}: wall run has invalid height`);
      }
      for (let z = run.z; z < run.z + run.depth; z++) {
        for (let x = run.x; x < run.x + run.width; x++) {
          const key = `${x},${z}`;
          if (covered.has(key)) fail(`seed ${seed}: wall run overlap at ${key}`);
          if (wallMap.get(key) !== run.height) {
            fail(`seed ${seed}: wall run height mismatch at ${key}`);
          }
          covered.set(key, run.height);
        }
      }
    }
    if (covered.size !== wallMap.size) {
      fail(`seed ${seed}: wall runs cover ${covered.size} of ${wallMap.size} cells`);
    }
    minWallRuns = Math.min(minWallRuns, layout.wallRuns.length);
    maxWallRuns = Math.max(maxWallRuns, layout.wallRuns.length);

    const rng = createRandom(seed);
    const placement = placeRooms(rng, layout.size);
    if (!placement.ok) {
      fail(`seed ${seed}: room placement failed`);
      continue;
    }
    const carved = carveCorridors(placement.rooms, rng, layout.size);
    const treeEdges = carved.connections.filter((edge) => edge.kind === 'tree').length;
    const loopEdges = carved.connections.filter((edge) => edge.kind === 'loop').length;

    if (treeEdges !== placement.rooms.length - 1) {
      fail(`seed ${seed}: expected ${placement.rooms.length - 1} tree edges, got ${treeEdges}`);
    }
    if (loopEdges > 1) {
      fail(`seed ${seed}: more than one optional loop`);
    }
    loops += loopEdges;

    for (const cell of carved.corridorCells) {
      const insideRoom = layout.rooms.some(
        (room) =>
          cell.x >= room.x &&
          cell.x < room.x + room.width &&
          cell.z >= room.z &&
          cell.z < room.z + room.depth
      );
      if (insideRoom) {
        fail(`seed ${seed}: corridor cell ${cell.x},${cell.z} is inside a room`);
      }
      if (!floorSet.has(`${cell.x},${cell.z}`)) {
        fail(`seed ${seed}: corridor cell ${cell.x},${cell.z} is not floor`);
      }
    }

    checked++;
  }

  console.log(`Verified ${checked} of ${SEEDS} seeds.`);
  console.log(`Room counts: ${JSON.stringify([...roomCounts.entries()].sort())}.`);
  console.log(`Wall runs: ${minWallRuns} to ${maxWallRuns}.`);
  console.log(`Laid out optional loops: ${loops}.`);
  if (!process.exitCode) console.log('Dungeon verification passed.');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  rmSync(output, { recursive: true, force: true });
}
