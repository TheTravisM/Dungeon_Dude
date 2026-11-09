# Micro-step 04-09 — Diorama plinth and floor-edge trim

---

**Parent phase:** Step 04-09  
**Task type:** CODE / VISUAL  
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

Give the level a clear miniature-diorama silhouette with a simple plinth and restrained edge trim.

---

## Inspect first

- Approved 4.00 plinth dimensions/material decisions.
- Floor and wall renderers.
- Current color tokens in `src/styles/_variables.scss` (read only) and existing lighting/effects.

---

## Exact scope

1. Create a focused plinth/trim component with a small number of meshes or instanced pieces, not a tile-by-tile trim system.
2. Make the base slightly larger than the dungeon footprint and visually separate its side faces from playable floor surfaces.
3. Ensure trim does not cover room entrances, occlude the playable area, or create z-fighting.
4. Keep materials consistent with the existing stone/diorama palette and avoid new post-processing effects.
5. Do not change global styles or color-token files. Do not add collision bodies in this task unless the approved 4.00 design explicitly requires the plinth to support the existing floor collider.

---

## Acceptance criteria

- [ ] The dungeon reads as a miniature object from the fixed isometric camera.
- [ ] The plinth does not intersect/cover walkable floor tiles, wall openings, or UI.
- [ ] Geometry and draw calls remain modest.

---

## Verification

- Run all required checks and visually inspect the plinth from the normal camera. Ask the user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
