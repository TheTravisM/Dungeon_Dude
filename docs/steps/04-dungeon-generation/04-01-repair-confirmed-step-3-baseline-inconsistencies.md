# Micro-step 04-01 — Repair confirmed Step 3 baseline inconsistencies

---

**Parent phase:** Step 04-01  
**Task type:** CONDITIONAL BASELINE REPAIR  
**Status:** Pending  
**Depends on:** 4.00 audit and user-approved repair scope.

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

Restore a clean TypeScript/lint/build baseline before dungeon implementation, fixing only the failures confirmed by 4.00.

---

## Inspect first

- The 4.00 audit report and the approved correction note in `AI_HANDOFF.md`.
- `src/game/constants.ts`, `src/game/store.ts`, `src/types/index.ts` (read only), `src/components/scene/Floor.tsx`, `src/components/physics/FloorCollider.tsx`, `src/components/physics/GamePhysics.tsx`, and `src/vite-env.d.ts`.

---

## Exact scope

1. If 4.00 confirms the missing `FLOOR_THICKNESS` export, add the smallest shared constant in `src/game/constants.ts`; choose its value from existing floor geometry/intended world scale and record the choice. Do not edit the protected type file.
2. If 4.00 confirms the Zustand implementation is missing required `GameState` fields/actions, implement the already-declared `debugPanelOpen`, `physicsDebug`, `toggleDebugPanel`, and `togglePhysicsDebug` members in `src/game/store.ts`. Initialize physics debug from the existing typed `VITE_DEBUG_PHYSICS` value, defaulting false. Do not wire the UI yet; that is 4.10.
3. Fix only additional baseline errors explicitly identified in the approved 4.00 report. Do not refactor unrelated modules.
4. If 4.00 reports that baseline checks already pass and no repair is required, make no code changes; report 4.01 as not applicable and request user approval to mark it N/A.

---

## Acceptance criteria

- [ ] Only the exact Step 3 baseline errors identified by 4.00 are resolved.
- [ ] Protected files remain untouched.
- [ ] TypeScript, lint, and production build pass, or remaining unrelated failures are precisely documented and escalated.

---

## Verification

- Run all required checks. No browser check unless the repair unexpectedly changes rendered behavior.

---

## Important limits

- Never create fake store fields merely to silence TypeScript. Implement the interface already present, or report why its contract is contradictory.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
