# Micro-step 06-01 — Monster archetype data and entity contract

---

**Parent phase:** Step 06-01  
**Task type:** CODE / DATA  
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

Define the small set of monster archetypes and their ECS data contract without rendering or AI behavior.

---

## Inspect first

- `src/types/index.ts` (read only), `src/game/ecs.ts`, hero entity contract, dungeon room/layout data.
- Approved combat backlog in AI_HANDOFF.

---

## Exact scope

1. Define archetype configuration in a new game module: health, attack power, movement speed, detection/attack ranges, and visual identifier.
2. Reuse the existing Miniplex Entity shape/factory patterns. Do not add global types to the protected type file.
3. Keep values data-driven and immutable; avoid embedding behavior in React components.
4. Do not add new dependencies or modify package manifests.

---

## Acceptance criteria

- [ ] Archetypes have explicit typed, sensible values.
- [ ] Entity data is compatible with the existing `monsterQuery` and factory approach.
- [ ] No runtime spawn, rendering, or combat code is added.

---

## Verification

- Run all required checks.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
