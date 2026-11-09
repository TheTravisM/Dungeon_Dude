# Micro-step 04-11 — Compose dungeon in App and remove temporary probes

---

**Parent phase:** Step 04-11  
**Task type:** CODE / INTEGRATION  
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

Replace the Step 3 preview scene with the complete dungeon while preserving the existing canvas, camera, lighting, physics, and post-processing architecture.

---

## Inspect first

- `App.tsx`, `App.module.scss`, `GamePhysics.tsx`, all new dungeon components, existing `Floor.tsx`, `FloorCollider.tsx`, `ReferenceBlock.tsx`, and `PhysicsProbe.tsx`.
- Approved Step 4 sections of AI_HANDOFF.

---

## Exact scope

1. Create/finish a thin `Dungeon.tsx` orchestration component that composes pure generation data, instanced floor/walls, the single static collider, and the plinth. Keep logic in pure game modules and rendering in focused components.
2. Mount the dungeon inside the existing `<GamePhysics>` boundary and existing Canvas. Preserve `IsometricCamera`, `Lighting`, and `Effects` order/behavior.
3. Remove the temporary preview `Floor`, duplicate `FloorCollider`, `PhysicsProbe`, and `ReferenceBlock` from the active scene. Delete temporary components only if no longer referenced anywhere; report deletions.
4. Ensure the generated seed is stable and visible in a concise development diagnostic or otherwise easy to reproduce; do not add unrelated gameplay UI.
5. Keep the current Step 3 badge text accurate until the final Step 4 acceptance updates it.

---

## Acceptance criteria

- [ ] The app renders only the new dungeon geometry; no duplicate preview floor/probe/reference block remains.
- [ ] The existing fixed camera, lighting, post-processing, and Rapier physics remain active.
- [ ] All rooms/corridors are visible and connected.
- [ ] The single static collider and renderers use the same DungeonLayout.
- [ ] The scene composition remains modular and components stay under 200 lines.

---

## Verification

- Run all required checks. Browser-verify the complete scene, no duplicate objects, visible shadowing, camera cutaways, and physics debug toggle. Ask user to confirm.

---

## Important limits

- Do not begin Hero implementation. This micro-step is dungeon integration only.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
