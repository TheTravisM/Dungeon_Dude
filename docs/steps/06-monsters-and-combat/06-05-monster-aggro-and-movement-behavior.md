# Micro-step 06-05 — Monster aggro and movement behavior

---

**Parent phase:** Step 06-05  
**Task type:** CODE / AI  
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

Implement monster idle/aggro/chase/attack state transitions and movement toward the hero using the established pathfinding/physics systems.

---

## Inspect first

- Monster archetypes, spawn manager, spatial hash, Step 5 pathfinding/controller patterns.
- Existing Entity state union and AI data contract (read only).

---

## Exact scope

1. Implement focused monster AI systems outside render components.
2. Use the spatial index for proximity/aggro detection.
3. Use the shared pathfinding/navigation utilities where appropriate; throttle replanning.
4. Use Rapier for collisions/physical movement. Do not add custom collision math or per-frame full-world scans.
5. Define clear aggro start/stop ranges, chase target, cooldown transitions, and deterministic fallback when paths are unavailable.
6. Do not implement sword-hit events in this task.

---

## Acceptance criteria

- [ ] Monsters idle when hero is outside aggro range and pursue when inside.
- [ ] Pathfinding respects walkable cells and Rapier walls.
- [ ] Systems avoid O(n²) proximity scans and per-frame A* recalculation.
- [ ] AI state stays in ECS/refs, not React state.

---

## Verification

- Run all required checks and browser-verify aggro/chase and wall behavior. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
