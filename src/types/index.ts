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
  isAutoPlaying: boolean;
  currentDepth: number;
  goldCollected: number;
  monstersSlain: number;
  lastInputTime: number;
  setAutoPlaying: (status: boolean) => void;
  updateLastInputTime: () => void;
  incrementGold: (amount: number) => void;
  incrementMonstersSlain: () => void;
  descendToNextLevel: () => void;
}

// Miniplex ECS Entity definition
export interface Entity {
  id: string;
  isHero?: boolean;
  isMonster?: boolean;
  
  // Spatial data
  position?: Vector3;
  velocity?: Vector3;
  
  // Combat stats
  health?: number;
  maxHealth?: number;
  attackPower?: number;
  
  // AI State
  targetPosition?: Vector3;
  state?: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
}