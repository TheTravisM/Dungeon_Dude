# Micro-step 06-08 — Death handling, pooling, and cleanup

---

**Parent phase:** Step 06-08  
**Task type:** CODE / PERFORMANCE  
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

Handle monster death and cleanup safely while reusing entities/visual resources where justified.

---

## Inspect first

- Monster render lifecycle, spawn manager, combat/damage system, Miniplex world/query.
- Three/R3F resource disposal conventions in installed versions.

---

## Exact scope

1. Implement a clear dead/despawn lifecycle so entities leave active AI/spatial queries immediately.
2. Add bounded pooling/reuse for monster entities or meshes only if it materially reduces allocations and does not complicate ECS archetype consistency.
3. Ensure pooled objects reset health, state, position, velocity, event subscriptions, and visual state before reuse.
4. Dispose of resources/listeners safely; do not dispose shared geometry/materials still used elsewhere.
5. Do not add particle systems beyond the approved scope.

---

## Acceptance criteria

- [ ] Dead monsters cannot attack or be targeted.
- [ ] Spatial index and ECS queries do not retain dead entities.
- [ ] Reuse/reset does not leak old state or duplicate listeners.
- [ ] Pooling remains bounded and simpler than constructing all instances if pooling is not warranted; document if evidence says not to pool.

---

## Verification

- Run all required checks and browser-verify death/respawn or reuse. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
