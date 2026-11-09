import type { DungeonRoom } from '../../types';
import {
  DUNGEON_MARGIN,
  DUNGEON_ROOM_MAX,
  DUNGEON_ROOM_MAX_ATTEMPTS,
  DUNGEON_ROOM_MAX_SIZE,
  DUNGEON_ROOM_MIN,
  DUNGEON_ROOM_MIN_SIZE,
  DUNGEON_ROOM_SPACING,
  DUNGEON_SIZE,
  DUNGEON_START_ROOM_MAX,
  DUNGEON_START_ROOM_MIN,
} from './constants';
import type { RandomSource } from './random';

export type RoomPlacementResult =
  | { ok: true; rooms: DungeonRoom[]; attempts: number }
  | { ok: false; rooms: DungeonRoom[]; attempts: number; reason: string };

/**
 * True when a candidate keeps the configured margin and leaves at least one
 * empty tile between itself and every room already placed. Checking the
 * expanded rectangle avoids a second pass over corridor or wall data.
 */
function fitsWithSpacing(
  candidate: DungeonRoom,
  rooms: readonly DungeonRoom[],
  size: number
): boolean {
  if (
    candidate.x < DUNGEON_MARGIN ||
    candidate.z < DUNGEON_MARGIN ||
    candidate.x + candidate.width > size - DUNGEON_MARGIN ||
    candidate.z + candidate.depth > size - DUNGEON_MARGIN
  ) {
    return false;
  }

  return rooms.every(
    (room) =>
      !(
        candidate.x < room.x + room.width + DUNGEON_ROOM_SPACING &&
        candidate.x + candidate.width + DUNGEON_ROOM_SPACING > room.x &&
        candidate.z < room.z + room.depth + DUNGEON_ROOM_SPACING &&
        candidate.z + candidate.depth + DUNGEON_ROOM_SPACING > room.z
      )
  );
}

function makeRoom(x: number, z: number, width: number, depth: number): DungeonRoom {
  return {
    x,
    z,
    width,
    depth,
    center: { x: x + (width >> 1), z: z + (depth >> 1) },
  };
}

/**
 * Places rooms inside the grid using only the supplied deterministic random
 * source. The start room is centered so the spawn point stays near the middle
 * of the diorama. Every later room is bounded and spacing-checked before it is
 * accepted. A failed placement returns an explicit result rather than a
 * partial layout that callers might mistake for valid.
 */
export function placeRooms(
  rng: RandomSource,
  size: number = DUNGEON_SIZE
): RoomPlacementResult {
  const rooms: DungeonRoom[] = [];
  // Vary the target per seed within the approved range so the maximum is
  // exercised while the minimum fallback still protects small layouts.
  const target = rng.int(DUNGEON_ROOM_MIN, DUNGEON_ROOM_MAX);

  const startWidth = rng.int(DUNGEON_START_ROOM_MIN, DUNGEON_START_ROOM_MAX);
  const startDepth = rng.int(DUNGEON_START_ROOM_MIN, DUNGEON_START_ROOM_MAX);
  const startRoom = makeRoom(
    Math.floor((size - startWidth) / 2),
    Math.floor((size - startDepth) / 2),
    startWidth,
    startDepth
  );

  if (!fitsWithSpacing(startRoom, rooms, size)) {
    return {
      ok: false,
      rooms,
      attempts: 0,
      reason: `Start room does not fit a ${size} by ${size} grid`,
    };
  }
  rooms.push(startRoom);

  let attempts = 0;
  while (rooms.length < target && attempts < DUNGEON_ROOM_MAX_ATTEMPTS) {
    attempts += 1;

    const width = rng.int(DUNGEON_ROOM_MIN_SIZE, DUNGEON_ROOM_MAX_SIZE);
    const depth = rng.int(DUNGEON_ROOM_MIN_SIZE, DUNGEON_ROOM_MAX_SIZE);
    const maxX = size - DUNGEON_MARGIN - width;
    const maxZ = size - DUNGEON_MARGIN - depth;

    if (maxX < DUNGEON_MARGIN || maxZ < DUNGEON_MARGIN) continue;

    const candidate = makeRoom(
      rng.int(DUNGEON_MARGIN, maxX),
      rng.int(DUNGEON_MARGIN, maxZ),
      width,
      depth
    );

    if (fitsWithSpacing(candidate, rooms, size)) rooms.push(candidate);
  }

  if (rooms.length < DUNGEON_ROOM_MIN) {
    return {
      ok: false,
      rooms,
      attempts,
      reason: `Placed ${rooms.length} rooms; at least ${DUNGEON_ROOM_MIN} are required`,
    };
  }

  return { ok: true, rooms, attempts };
}
