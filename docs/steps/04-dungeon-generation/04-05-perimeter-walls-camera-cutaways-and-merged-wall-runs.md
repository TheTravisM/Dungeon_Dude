# Micro-step 04-05 — Perimeter walls, camera cutaways, and merged wall runs

---

**Parent phase:** Step 04-05  
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

Generate boundary wall cells from the completed floor map, classify cutaway heights for the fixed camera, and merge compatible wall cells into collider runs.

---

## Inspect first

- Approved 4.00 wall/camera design.
- `DungeonLayout`, `DungeonWallCell`, `DungeonWallRun`, and `WallHeight` definitions (read only).
- Camera position in `src/components/scene/IsometricCamera.tsx`.
- 4.02–4.04 generator modules.

---

## Exact scope

1. Generate walls only along exposed orthogonal edges of the walkable floor set; never place a blocking wall between two walkable adjacent cells.
2. Apply the approved tall/low camera cutaway rule using the fixed camera orientation. Follow the existing type comment: far-edge walls are tall and camera-facing edges become low ledges so the view remains open.
3. Keep the wall cutaway result stable and precomputed. Do not perform render-loop raycasts or introduce large transparent wall surfaces.
4. Merge adjacent wall cells only when their height and run orientation match. Represent runs using the existing `DungeonWallRun` fields; avoid adding types to protected `src/types/index.ts`.
5. Ensure wall cells/runs are deterministic and do not leave collider gaps at corners or corridor mouths.

---

## Acceptance criteria

- [ ] All floor openings/corridors remain open.
- [ ] Every exposed dungeon boundary is protected by wall geometry.
- [ ] Tall/low classification is stable for the fixed camera and preserves the approved camera cutaway intent.
- [ ] Every wall cell is covered by exactly one appropriate run, with no unintended duplicate runs.
- [ ] The output is reproducible by seed.

---

## Verification

- Run all required checks. Visual orientation is verified after 4.07/4.11 in the browser.

---

## Important limits

- Do not use per-frame raycasts or high-overdraw transparent wall fades. Preserve collision coverage even where the visual height is reduced.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
