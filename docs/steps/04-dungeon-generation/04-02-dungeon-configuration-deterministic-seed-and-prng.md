# Micro-step 04-02 — Dungeon configuration, deterministic seed, and PRNG

---

**Parent phase:** Step 04-02  
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

Create a small, pure dungeon-generation foundation that provides validated configuration and deterministic random values.

---

## Inspect first

- Approved Step 4 design recorded by 4.00 in `AI_HANDOFF.md` (read only that entry).
- `src/types/index.ts` (read only), `src/game/constants.ts`, `src/game/ecs.ts`, and current folder conventions under `src/game/`.

---

## Exact scope

1. Create a focused dungeon configuration module for values actually approved in 4.00: grid size must derive from `FLOOR_SIZE`; room bounds/count, corridor width, wall dimensions/heights, and default seed must have named constants.
2. Create a deterministic seeded PRNG helper with a documented algorithm and no `Math.random()` usage. Expose a small typed API suitable for repeatable room/corridor generation.
3. Keep this layer pure TypeScript: no React, R3F, Rapier, Zustand, browser globals, or side effects.
4. Do not edit `src/types/index.ts`; reuse the existing types. Do not add an environment variable or alter `.env.development`.

---

## Acceptance criteria

- [ ] The same seed and same configuration produce the same random sequence.
- [ ] Configuration values are centralized and reflect the approved 4.00 design.
- [ ] No runtime or UI code is introduced.

---

## Verification

- Run all required checks. If no test runner exists, add a temporary verification method only if it does not add/modify dependencies or leave throwaway files behind; otherwise document how determinism will be browser-verified in a later integration step.

---

## Important limits

- Do not choose new room rules or seed semantics here. Those are approved in 4.00.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
