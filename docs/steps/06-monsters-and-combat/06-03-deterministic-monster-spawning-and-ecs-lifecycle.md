# Micro-step 06-03 — Deterministic monster spawning and ECS lifecycle

---

**Parent phase:** Step 06-03  
**Task type:** CODE / GAMEPLAY  
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

Spawn monsters in valid dungeon rooms and manage their Miniplex entity lifecycle without duplicates.

---

## Inspect first

- Dungeon room/floor cells and seed source.
- 6.01 archetype configuration, 6.02 visuals, `src/game/ecs.ts`.
- Hero spawn and entity lifecycle approach from Step 5.

---

## Exact scope

1. Choose spawn cells deterministically from approved room candidates, excluding hero spawn and invalid/occupied cells.
2. Use `createMonster` and the existing monster query. Register/remove entities with stable lifecycle behavior.
3. Respect a bounded per-room/level population and preserve reproducibility for a given dungeon seed.
4. Keep spawn logic outside Monster.tsx.

---

## Acceptance criteria

- [ ] All monsters spawn on walkable cells inside valid rooms.
- [ ] No monster spawns on the hero start cell.
- [ ] Seeded levels produce reproducible spawn placement.
- [ ] Mount/unmount or level reset does not leak duplicate entities.

---

## Verification

- Run all required checks and browser-verify placements. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
