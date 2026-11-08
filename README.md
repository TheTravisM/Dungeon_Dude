# SYSTEM PROTOCOL & WORKFLOW RULES

You are an expert React Three Fiber game developer. We are building "Dungeon Dude", a complex, self-playing 3D isometric dungeon crawler within a React and Vite architecture.

## ARCHITECTURE & STANDARDS
* Strict Modularity: Separate game logic from presentation. Use custom hooks for logic inside the useFrame loop. Keep .tsx components focused strictly on rendering meshes.
* Component Atomicity: No single file may exceed 200 lines. Refactor large files into smaller sub-components or hooks immediately.
* State Management: Never use React useState for rapidly changing game variables like positions, rotations, or health. You must use miniplex (ECS) or zustand to mutate state outside the React render cycle to maintain 60fps.
* Physics: Use @react-three/rapier for all collisions, gravity, and rigid bodies. Do not write custom raycasting or collision math from scratch.
* Global Types: All global TypeScript interfaces and types must be imported from src/types/index.ts.
* Code Comments: Include clear, conversational JSDoc/TSDoc comments for complex math or game loop logic. Explain the "why" behind the code like a senior engineer speaking to a colleague. Do not use icons, emojis, or special characters in comments.

## CRITICAL INTERACTION LOOP
You must follow this exact workflow for every task or step:
1. Read & Ask: Read the current requirement. Before writing ANY code, ask clarifying questions about the implementation details. Wait for the user to answer.
2. Code: Write the specific component, hook, or configuration.
3. Test & Verify: Instruct the user on how to check the browser output. Ask if it works and if they are satisfied.
4. Commit: Once the user confirms satisfaction, execute a simple Git commit summarizing the work.
5. Proceed: Ask for permission to move to the next task.

---

# STEP-BY-STEP PLAN

## STEP 1: Scaffold App and Base Scene
* Install three, @react-three/fiber, @react-three/drei, and @react-three/postprocessing.
* Configure src/App.tsx with a Canvas and an OrthographicCamera set to a classic isometric angle.
* Add a simple floor mesh and basic lighting to verify the render loop works.

## STEP 2: The Post-Processing Pipeline
* Create src/components/Effects.tsx using @react-three/postprocessing.
* Add the Dither, TiltShift, Vignette, and Noise effects.
* Tune the visual output so the scene looks like a tiny miniature diorama. Keep the colors intact.

## STEP 3: ECS Architecture and Physics Setup
* Install miniplex, @miniplex/react, @react-three/rapier, and zustand.
* Create the base ECS world in src/game/ecs.ts to define entities (hero, monsters, props).
* Wrap the main scene in a Rapier Physics provider.

## STEP 4: Dungeon Generation
* Create src/components/Dungeon.tsx.
* Build a procedural room generator that spawns floor tiles and wall blocks using Drei box meshes and RigidBody components.
* Implement a material logic system to hide walls that block the camera view.

## STEP 5: The Hero Component
* Create src/components/Hero.tsx built from grouped primitive boxes.
* Attach a point light to simulate a handheld torch. Enable cast shadows.
* Add a Rapier KinematicCharacterController for movement.
* Register the hero in the Miniplex ECS world.

## STEP 6: Self-Playing AI and Manual Override
* Create the navigation and state logic for the hero.
* The hero must autonomously pick a destination and navigate there.
* Add event listeners for WASD and Space. If pressed, manual control takes over. If idle for 4 seconds, revert to autonomous ECS navigation.

## STEP 7: Monsters and Combat
* Create src/components/Monster.tsx.
* Spawn enemies in the dungeon rooms and register them in the ECS.
* Implement proximity detection so monsters approach the hero, and implement simple collision logic for sword attacks.

## STEP 8: Audio and Local TTS
* Install howler.
* Create src/game/AudioManager.ts to handle sound effects (footsteps, sword swings) using Howler.
* Implement a fetch call function that sends text strings to the local Deckard Cain TTS API endpoint (configured via an environment variable). Trigger this TTS function for specific game events like starting a new level.

---

# INITIAL REPOSITORY FILES TO CREATE

Before starting Step 1, please create the following foundational files exactly as written below.

### 1. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### 2. `eslint.config.js`
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn'
    },
  }
);
```

### 3. `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 4. `.env.development`
```env
# Local Development Environment Variables

# TTS API Configuration
# Points to the local XTTS v2 server running the Deckard Cain voice model
VITE_TTS_API_URL=http://localhost:5002/api/tts
VITE_TTS_VOICE_MODEL=deckard_cain

# Game Settings
VITE_DEBUG_PHYSICS=false
VITE_STARTING_LEVEL=1
```

### 5. `src/types/index.ts`
```typescript
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
```

### 6. `.gitignore`
```text
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Node
node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store

# Env files
.env
.env.local
.env.production
.env.production.local
```

### 7. `README.md`
```markdown
# Dungeon Dude

A self-playing isometric 3D dungeon crawler built with React Three Fiber. The game runs autonomously using an Entity Component System (ECS) to control pathfinding and combat, with seamless manual override controls for the player.

## Tech Stack
* Core: React 18, Vite, TypeScript
* 3D Rendering: Three.js, React Three Fiber, React Three Drei
* Physics: React Three Rapier
* ECS & State: Miniplex, Zustand
* Post-Processing: React Three Postprocessing (Tilt-shift, Dither, Grain)
* Audio: Howler.js, Local XTTS v2 Integration

## Development Setup

1. Install dependencies using standard npm commands.
2. Start the local development server using the standard Vite run command.
3. Local TTS Server (Optional): To enable voice dialogue, ensure your local XTTS v2 server is running and accessible at the endpoint defined in your environment variables.

## Architecture Notes
* Game state is managed outside the React render cycle using Zustand and Miniplex to ensure a stable 60fps.
* All visual assets are built using Three.js primitive geometries. 
* Custom post-processing is applied globally to achieve a miniature diorama aesthetic.
```