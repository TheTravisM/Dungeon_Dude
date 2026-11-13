import type { DungeonLayout, DungeonRoom, GridCell } from '../../types';
import { FLOOR_TOP, gridToWorld } from './constants';
import { createRandom, type RandomSource } from './random';

/** Dressing archetypes assigned per room. The entrance is always its own type. */
export type RoomTheme =
  | 'entrance'
  | 'barracks'
  | 'shrine'
  | 'prison'
  | 'treasury'
  | 'collapsed'
  | 'garden';

export type PropKind =
  | 'pillar'
  | 'barrel'
  | 'crate'
  | 'rubble'
  | 'bones'
  | 'mushroom'
  | 'brokenPillar';

export type DecalKind = 'moss' | 'puddle' | 'crack';

export interface PropPlacement {
  kind: PropKind;
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
  roomIndex: number;
}

export interface DecalPlacement {
  kind: DecalKind;
  x: number;
  z: number;
  rotation: number;
  scale: number;
}

export interface SconcePlacement {
  x: number;
  y: number;
  z: number;
  /** Y rotation that makes the mount face into the room. */
  rotation: number;
  lit: boolean;
  banner: boolean;
}

export interface ChestPlacement {
  x: number;
  y: number;
  z: number;
  rotation: number;
}

export interface AltarPlacement {
  x: number;
  y: number;
  z: number;
  rotation: number;
  theme: RoomTheme;
}

export interface BrazierPlacement {
  x: number;
  y: number;
  z: number;
  lit: boolean;
}

export interface PrisonPlacement {
  x: number;
  y: number;
  z: number;
  rotation: number;
  width: number;
}

export interface DungeonDecor {
  props: PropPlacement[];
  decals: DecalPlacement[];
  sconces: SconcePlacement[];
  chests: ChestPlacement[];
  altars: AltarPlacement[];
  braziers: BrazierPlacement[];
  prisons: PrisonPlacement[];
  themes: RoomTheme[];
}

const THEMES: readonly RoomTheme[] = [
  'barracks',
  'shrine',
  'prison',
  'treasury',
  'collapsed',
  'garden',
];

const DECAL_WEIGHTS: Readonly<Record<RoomTheme, readonly DecalKind[]>> = {
  entrance: ['crack', 'crack', 'moss'],
  barracks: ['crack', 'moss', 'crack'],
  shrine: ['moss', 'moss', 'crack'],
  prison: ['moss', 'puddle', 'crack'],
  treasury: ['crack', 'crack', 'moss'],
  collapsed: ['crack', 'crack', 'moss'],
  garden: ['moss', 'moss', 'puddle'],
};

const PROP_POOL: Readonly<Record<RoomTheme, readonly PropKind[]>> = {
  entrance: ['barrel', 'crate'],
  barracks: ['barrel', 'crate', 'bones', 'crate', 'barrel'],
  shrine: ['pillar', 'bones'],
  prison: ['bones', 'rubble', 'rubble'],
  treasury: ['crate', 'barrel', 'crate'],
  collapsed: ['rubble', 'rubble', 'brokenPillar'],
  garden: ['mushroom', 'mushroom', 'rubble'],
};

const QUARTER_TURN = Math.PI / 2;

function roomRng(seed: number, roomIndex: number): RandomSource {
  return createRandom(
    ((seed ^ 0x2f6ea3d1) + Math.imul(roomIndex + 1, 0x9e3779b1)) >>> 0
  );
}

function cellKey(cell: GridCell): string {
  return `${cell.x},${cell.z}`;
}

function gridPosition(layout: DungeonLayout, cell: GridCell) {
  return {
    x: gridToWorld(cell.x, layout.size),
    z: gridToWorld(cell.z, layout.size),
  };
}

/** True when a cell is inside the supplied room. */
function insideRoom(room: DungeonRoom, cell: GridCell): boolean {
  return (
    cell.x >= room.x &&
    cell.x < room.x + room.width &&
    cell.z >= room.z &&
    cell.z < room.z + room.depth
  );
}

function roomCells(layout: DungeonLayout, room: DungeonRoom): GridCell[] {
  const floor = new Set(layout.floorCells.map(cellKey));
  const cells: GridCell[] = [];
  for (let z = room.z; z < room.z + room.depth; z++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (floor.has(`${x},${z}`)) cells.push({ x, z });
    }
  }
  return cells;
}

/**
 * Builds all cosmetic placements from the same seed as the layout. The module
 * is pure and renderer-free so the prop plan can be cached, tested, and reused
 * by both the hi-fi and low-quality scene without drifting.
 */
export function generateDecor(layout: DungeonLayout): DungeonDecor {
  const floor = new Set(layout.floorCells.map(cellKey));
  const used = new Set<string>();
  const props: PropPlacement[] = [];
  const decals: DecalPlacement[] = [];
  const sconces: SconcePlacement[] = [];
  const chests: ChestPlacement[] = [];
  const altars: AltarPlacement[] = [];
  const braziers: BrazierPlacement[] = [];
  const prisons: PrisonPlacement[] = [];
  const themes: RoomTheme[] = [];

  const themeRng = createRandom(layout.seed ^ 0x7a3f19b5);

  const addProp = (
    kind: PropKind,
    cell: GridCell,
    roomIndex: number,
    rng: RandomSource,
    scaleRange: readonly [number, number] = [0.85, 1.15]
  ) => {
    const key = cellKey(cell);
    if (used.has(key) || !floor.has(key)) return false;
    used.add(key);
    const { x, z } = gridPosition(layout, cell);
    const scale =
      scaleRange[0] + rng.next() * (scaleRange[1] - scaleRange[0]);
    props.push({
      kind,
      x,
      y: FLOOR_TOP,
      z,
      rotation: rng.int(0, 3) * QUARTER_TURN + (rng.next() - 0.5) * 0.35,
      scale,
      roomIndex,
    });
    return true;
  };

  const addDecal = (
    kind: DecalKind,
    cell: GridCell,
    rng: RandomSource
  ): void => {
    const { x, z } = gridPosition(layout, cell);
    decals.push({
      kind,
      x: x + (rng.next() - 0.5) * 0.45,
      z: z + (rng.next() - 0.5) * 0.45,
      rotation: rng.next() * Math.PI * 2,
      scale: 0.65 + rng.next() * 0.9,
    });
  };

  const addSconce = (cell: GridCell, room: DungeonRoom, rng: RandomSource) => {
    if (sconces.length >= 30) return;

    // Find the side of the room that is backed by a wall.
    const candidates: Array<{ dx: number; dz: number }> = [];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cell.x + dx;
      const nz = cell.z + dz;
      if (insideRoom(room, { x: nx, z: nz })) continue;
      if (!floor.has(`${nx},${nz}`)) candidates.push({ dx, dz });
    }
    if (candidates.length === 0) return;

    const side = rng.pick(candidates);
    const { x, z } = gridPosition(layout, cell);
    sconces.push({
      x: x + side.dx * 0.4,
      y: FLOOR_TOP + 1.25,
      z: z + side.dz * 0.4,
      // Local +Z faces the room after this yaw.
      rotation: Math.atan2(-side.dx, -side.dz),
      lit: sconces.length % 3 === 0,
      banner: sconces.length % 4 === 1,
    });
  };

  for (let roomIndex = 0; roomIndex < layout.rooms.length; roomIndex++) {
    const room = layout.rooms[roomIndex];
    const rng = roomRng(layout.seed, roomIndex);
    const theme: RoomTheme = roomIndex === 0 ? 'entrance' : themeRng.pick(THEMES);
    themes.push(theme);
    const cells = roomCells(layout, room);
    if (cells.length === 0) continue;

    const freeCells = cells.filter(
      (cell) =>
        !(cell.x === room.center.x && cell.z === room.center.z) &&
        !used.has(cellKey(cell))
    );

    const takeCell = (): GridCell | null => {
      if (freeCells.length === 0) return null;
      const index = rng.int(0, freeCells.length - 1);
      return freeCells.splice(index, 1)[0];
    };

    const addRandomProp = (kinds: readonly PropKind[]) => {
      const cell = takeCell();
      if (!cell) return;
      addProp(rng.pick(kinds), cell, roomIndex, rng);
    };

    // Every room gets a small amount of scattered clutter.
    const scatter = rng.int(2, 4);
    for (let index = 0; index < scatter; index++) {
      addRandomProp(PROP_POOL[theme]);
    }

    // Corners of larger rooms get structural pillars. They read as architecture
    // rather than clutter and frame the room from the isometric camera.
    if (room.width >= 6 && room.depth >= 6 && theme !== 'garden') {
      const corners = [
        { x: room.x + 1, z: room.z + 1 },
        { x: room.x + room.width - 2, z: room.z + 1 },
        { x: room.x + 1, z: room.z + room.depth - 2 },
        { x: room.x + room.width - 2, z: room.z + room.depth - 2 },
      ];
      for (const corner of corners) addProp('pillar', corner, roomIndex, rng, [0.95, 1.1]);
    }

    // A sconce on up to two wall-adjacent cells per room.
    const sconceCount = rng.int(1, 2);
    for (let index = 0; index < sconceCount; index++) {
      const cell = takeCell();
      if (cell) addSconce(cell, room, rng);
    }

    // Room landmarks.
    const center = room.center;
    const pos = gridPosition(layout, center);

    if (theme === 'shrine') {
      altars.push({
        x: pos.x,
        y: FLOOR_TOP,
        z: pos.z,
        rotation: rng.int(0, 3) * QUARTER_TURN,
        theme,
      });
      for (const offset of [-1, 1]) {
        const { x, z } = gridPosition(layout, {
          x: center.x + offset,
          z: center.z,
        });
        braziers.push({ x, y: FLOOR_TOP, z, lit: true });
      }
    } else if (theme === 'treasury') {
      chests.push({
        x: pos.x,
        y: FLOOR_TOP,
        z: pos.z,
        rotation: rng.int(0, 3) * QUARTER_TURN,
      });
    } else if (theme === 'prison') {
      const side = rng.chance(0.5) ? 1 : -1;
      const { x, z } = gridPosition(layout, {
        x: center.x + side * Math.floor(room.width / 2) - side,
        z: center.z,
      });
      prisons.push({
        x,
        y: FLOOR_TOP,
        z,
        rotation: side > 0 ? -QUARTER_TURN : QUARTER_TURN,
        width: Math.min(3, room.depth - 1),
      });
      addRandomProp(['bones', 'bones', 'rubble']);
    } else if (theme === 'collapsed') {
      for (let index = 0; index < 3; index++) {
        addRandomProp(['rubble', 'rubble', 'brokenPillar']);
      }
    } else if (theme === 'garden') {
      for (let index = 0; index < 4; index++) {
        addRandomProp(['mushroom', 'mushroom']);
      }
    } else if (theme === 'entrance') {
      // Two braziers flank the spawn so the first frame has a focal point.
      for (const offset of [-2, 2]) {
        const cell = { x: center.x + offset, z: center.z + 1 };
        if (!floor.has(cellKey(cell))) continue;
        const { x, z } = gridPosition(layout, cell);
        braziers.push({ x, y: FLOOR_TOP, z, lit: true });
        used.add(cellKey(cell));
      }
    }

    // Scatter floor dressing. Garden and prison rooms are deliberately damp.
    const decalCount = rng.int(3, 6);
    for (let index = 0; index < decalCount; index++) {
      const cell = takeCell();
      if (cell) addDecal(rng.pick(DECAL_WEIGHTS[theme]), cell, rng);
    }
  }

  // A little weathering in the halls keeps corridor runs from looking sterile.
  const corridorRng = createRandom(layout.seed ^ 0x4c1d7e27);
  const roomOfCell = new Map<string, number>();
  for (let roomIndex = 0; roomIndex < layout.rooms.length; roomIndex++) {
    const room = layout.rooms[roomIndex];
    for (let z = room.z; z < room.z + room.depth; z++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        roomOfCell.set(`${x},${z}`, roomIndex);
      }
    }
  }

  for (let index = 0; index < layout.floorCells.length; index += 11) {
    const cell = layout.floorCells[index];
    if (roomOfCell.has(cellKey(cell))) continue;
    if (corridorRng.chance(0.55)) {
      addDecal(
        corridorRng.pick(['crack', 'moss', 'puddle'] as const),
        cell,
        corridorRng
      );
    }
  }

  return {
    props,
    decals,
    sconces,
    chests,
    altars,
    braziers,
    prisons,
    themes,
  };
}
