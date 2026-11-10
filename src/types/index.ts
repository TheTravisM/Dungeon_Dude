/**
 * Global Type Definitions for Dungeon Dude
 */

import { Vector3 } from 'three';

// Represents a position in the 3D world
export interface Position {
  x: number;
  y: number;
  z: number;
}

// Zustand global game state
export interface GameState {
  isAutoMode: boolean;
  currentDepth: number;
  goldCollected: number;
  monstersSlain: number;
  hasKey: boolean;
  debugPanelOpen: boolean;
  physicsDebug: boolean;
  setAutoMode: (isAuto: boolean) => void;
  incrementGold: (amount: number) => void;
  incrementMonstersSlain: () => void;
  setHasKey: (hasKey: boolean) => void;
  descendToNextLevel: () => void;
  toggleDebugPanel: () => void;
  togglePhysicsDebug: () => void;
}

// Dungeon grid coordinates. Cells are zero-indexed from the grid corner.
export interface GridCell {
  x: number;
  z: number;
}

// A carved rectangular room. Rooms are kept for monster spawning and AI goals.
export interface DungeonRoom {
  x: number;
  z: number;
  width: number;
  depth: number;
  center: GridCell;
}

// Full-height walls sit on the far edges of the diorama. Low ledges sit
// everywhere else so the fixed isometric camera can see into corridors.
export type WallHeight = 'tall' | 'low';

export interface DungeonWallCell extends GridCell {
  height: WallHeight;
}

// Merged wall strips used for collision. One strip replaces many per-tile
// colliders, which keeps the Rapier broad phase cheap.
export interface DungeonWallRun {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: WallHeight;
}

export interface DungeonLayout {
  seed: number;
  size: number;
  rooms: DungeonRoom[];
  floorCells: GridCell[];
  wallCells: DungeonWallCell[];
  wallRuns: DungeonWallRun[];
  spawn: Position;
}

// Miniplex ECS Entity definition
export interface Entity {
  id: string;
  isHero?: boolean;
  isMonster?: boolean;
  
  // Spatial data
  position?: Vector3;
  velocity?: [number, number, number]; // [x, y, z] movement vector
  
  // Combat stats
  health?: number;
  maxHealth?: number;
  attackPower?: number;
  
  // AI State
  targetPosition?: Vector3;
  state?: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';

  // Additions for Step 5
  isPlayer?: boolean;
  heading?: number; // Radians for visual mesh rotation

  // Points of Interest (Step 5: keys, stairs, loot, enemies)
  poiType?: 'loot' | 'key' | 'stairs' | 'enemy';
  isActive?: boolean; // True if the POI hasn't been looted/used yet
}