# Micro-step 04-00 — Read-only baseline audit and dungeon design proposal

---

**Parent phase:** Step 04-00  
**Task type:** READ-ONLY / DESIGN  
**Status:** Pending  
**Depends on:** Start here. No source changes are allowed.

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

Establish the real local Step 3 baseline and turn the approved Step 4 direction into a precise, user-reviewable dungeon-generation design. Do not change application files in this task.

---

## Inspect first

- `git rev-parse HEAD`, `git status --short`, and the last five commits.
- Relevant headings in `AI_HANDOFF.md`: Current Status; approved Step 4 decisions; Step 4 design review; Next Immediate Task; Handoff Protocol.
- `Dungeon_Dude_Plan.md` Step 4 only.
- `.cursorrules` (architecture rules only).
- `src/types/index.ts`, `src/game/constants.ts`, `src/game/store.ts`, `src/App.tsx`, `src/App.module.scss`, `src/components/scene/Floor.tsx`, `src/components/scene/IsometricCamera.tsx`, `src/components/physics/FloorCollider.tsx`, `src/components/physics/GamePhysics.tsx`, `src/vite-env.d.ts`, `package.json`, and `package-lock.json`.

---

## Exact scope

1. Run baseline `npx tsc -b --pretty false`, `npm run lint`, and `npm run build` without changing source. Record exact results and errors.
2. Check whether `FLOOR_THICKNESS` is exported and used consistently. Check whether the Zustand store fully implements every required `GameState` member. Verify other discrepancies rather than assuming only these two exist.
3. Confirm current seed source, coordinate conventions, floor top height, and wall geometry conventions from source.
4. Propose a deterministic 20×20 layout design using the existing `DungeonLayout` types: room count/dimensions/spacing, bounded placement strategy, corridor algorithm, connectivity guarantee, seed source/default, spawn-cell selection, coordinate-to-world mapping, wall perimeter creation, tall/low cutaway classification for camera `[20,20,20]`, wall-run merging, floor/wall instance batching, compound collider shape, and plinth dimensions/material approach.
5. A reasonable starting proposal is a fixed default seed such as 1337 with a seed parameter, approximately 4–6 rooms sized around 3–6 tiles, one-tile corridors, no overlapping rooms, a connected room graph (e.g. a spanning tree plus at most one optional loop), and a reproducible spawn in a designated start room. These are recommendations only: check feasibility against the grid and ask the user to approve or adjust them before they become implementation requirements.
6. Check the Step 3 status conflict in `AI_HANDOFF.md`. Do not redo approved Step 3 work. Use `git log` to identify the actual Step 3 commit hash if present; never invent it. Note that the uploaded/current plan places the old ask-first loop in `Dungeon_Dude_Plan.md`, while `.cursorrules` is architecture-focused.

---

## Acceptance criteria

- [ ] No source-code changes.
- [ ] A concise baseline report: repository HEAD/status, exact command outcomes, each confirmed discrepancy, and a recommended dungeon design with all decisions clearly separated into (a) already approved and (b) newly proposed.
- [ ] Call out whether 4.01 baseline repair is required. If checks pass, explain why 4.01 can be marked not applicable.
- [ ] Ask the user to approve the proposed design before treating 4.00 as complete. After approval, record the approved dungeon design and correction of stale Step 3 handoff instructions in `AI_HANDOFF.md` without deleting historical entries.

---

## Verification

- Run and report only the three baseline commands plus Git status/log. Do not run a browser check; this is read-only.

---

## Important limits

- This is an audit/design task, not an implementation task. Do not create a design document or modify INDEX/AI_HANDOFF until the user has approved the proposal.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
