# Step 05-00: Preflight & Dependencies

**Goal:** Prepare the repository for Step 5 by installing exact dependency versions, updating global ECS types, and cleaning up Step 3 artifacts that break the build. 

## 1. Package Installation
Update `package.json` with the following dependencies. Do not upgrade Vite or Rapier.

**Install these exactly:**
- `vitest@^3.2.7` (Pin to v3 to support Vite 5 without Node conflicts)
- `ngraph.path@^1.6.1` (Maintained, deterministic pathfinding graph)
- `mistreevous@^4.3.1` (Lightweight behavior tree for AI logic)

**Add to package.json scripts:**
```json
"test": "vitest"
```

## 2. ECS Type Additions
Update `src/types/index.ts` to add the required fields for Step 5.

**API Contract for Miniplex Entity:**
```typescript
export type Entity = {
  id: string;
  // Existing components...
  
  // Additions for Step 5:
  isPlayer?: boolean;
  heading?: number; // Radians for visual mesh rotation
  velocity?: [number, number, number]; // [x, y, z] movement vector
};
```

## 3. Codebase Cleanup
Perform the following surgical edits to fix existing TypeScript errors and remove outdated Step 3 artifacts.

**Target: `src/game/App.tsx`**
- Remove `<PhysicsProbe />` and `<ReferenceBlock />` components from the render tree.
- Remove their associated import statements.

**Target: `src/game/Floor.tsx` & `src/game/FloorCollider.tsx` (If they still exist)**
- The constant `FLOOR_THICKNESS` was removed from `constants.ts` in Step 4. 
- Remove any imports of `FLOOR_THICKNESS` in these files to resolve `TS2305` errors. Replace with a hardcoded `0.8` (diorama plinth thickness) where absolutely necessary, or delete the files entirely if Step 4's `Dungeon.tsx` has fully replaced them.

## Execution Constraints
- Do not write any hero or AI logic in this step.
- Output the complete `package.json`, `src/types/index.ts`, and updated `App.tsx` so they can be copied directly.
- Verify `tsc` passes after these edits before moving to the next step.