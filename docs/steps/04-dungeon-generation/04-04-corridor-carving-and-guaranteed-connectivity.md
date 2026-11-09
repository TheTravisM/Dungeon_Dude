# Micro-step 04-04 — Corridor carving and guaranteed connectivity

---

**Parent phase:** Step 04-04  
**Task type:** CODE  
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

Connect all generated rooms with walkable corridor floor cells so every room is reachable.

---

## Inspect first

- Approved 4.00 dungeon design, especially graph strategy and corridor width.
- 4.02 seeded PRNG/configuration and 4.03 room placement.
- `GridCell`, `DungeonRoom`, and `DungeonLayout` types (read only).

---

## Exact scope

1. Implement a pure corridor-carving function.
2. Use the approved connectivity strategy (recommended: connect rooms with a deterministic spanning tree, with only approved optional loops).
3. Carve corridors using the approved width and deterministic bend choice. Keep every cell within the grid.
4. Merge room interiors and corridors into a unique, stable `floorCells` array. Avoid duplicates and ensure corridors actually meet room floor cells.
5. Keep a clear separation between room placement, corridor carving, and final wall generation.

---

## Acceptance criteria

- [ ] Every room is reachable from the designated start room via four-directional walkable cells.
- [ ] All floor cells are in bounds and unique.
- [ ] The output is deterministic for a fixed seed.
- [ ] No corridor overwrites or disconnects a room; narrow chokepoints are intentional and documented.

---

## Verification

- Run all required checks. Connectivity can be checked with a bounded flood-fill helper during generation or later verification; do not add a dependency.

---

## Important limits

- Do not add monster spawn, loot, stairs, traps, or hero navigation in this task.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
