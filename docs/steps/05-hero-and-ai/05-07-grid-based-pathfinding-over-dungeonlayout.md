# Micro-step 05-07 — Grid-based pathfinding over DungeonLayout

---

**Parent phase:** Step 05-07  
**Task type:** CODE / GAME LOGIC  
**Status:** Pending  
**Depends on:** None.

---

## Shared rules

Follow `docs/steps/INDEX.md`, especially its scope, architecture, protected-file, verification, and approval rules. Treat this file as the complete task scope. Do not load the entire high-level plan or handoff; inspect only the sections and source files named below.

- One micro-step only. Do not start future work or opportunistically refactor unrelated code.
- Use current source code to establish what exists and `AI_HANDOFF.md` for already-approved decisions. Report conflicts rather than guessing.
- Do not edit protected files or add dependencies. If that becomes necessary, stop and ask.
- Do not commit, tick the checklist, or mark the task complete before the user explicitly approves the implementation and required verification.
- On coding tasks, run `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, `git diff --check`, and report the exact outcome of each. For visual/physics tasks, also provide browser verification steps and wait for the user's confirmation.


---

## Objective

Implement a pure pathfinder that finds valid routes using the dungeon’s walkable floor cells.

---

## Inspect first

- `DungeonLayout`/`GridCell` definitions (read only).
- Dungeon generation output and coordinate helpers.
- Approved pathfinding constraints in AI_HANDOFF.

---

## Exact scope

1. Create a pure pathfinding module with no React, R3F, Rapier, DOM, or Zustand imports.
2. Use four-directional neighbor traversal over `floorCells`; never route through walls or cells outside the layout.
3. Use A* or another approved bounded algorithm with deterministic tie-breaking.
4. Return a clear result for unreachable goals and avoid allocating excessive temporary objects.
5. Do not add monster-specific spatial behavior or combat logic.

---

## Acceptance criteria

- [ ] Finds a path between connected walkable cells.
- [ ] Never returns a path through non-floor cells.
- [ ] Start=goal and unreachable goals are handled explicitly.
- [ ] Output is deterministic for identical inputs.

---

## Verification

- Run all required checks. If no test runner exists, document a deterministic browser/demo verification for the integration step; do not add Vitest.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
