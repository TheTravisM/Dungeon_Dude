# Micro-step 04-06 — Instanced floor rendering

---

**Parent phase:** Step 04-06  
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

Render dungeon floor cells with instancing so floor complexity does not create one React mesh/draw call per tile.

---

## Inspect first

- Approved 4.00 grid-to-world and floor geometry decisions.
- 4.02–4.05 layout output and `DungeonLayout` types.
- Current `Floor.tsx`, `FloorCollider.tsx`, `constants.ts`, `Effects.tsx`, and material/style conventions.

---

## Exact scope

1. Create a focused floor renderer under an appropriate dungeon component folder.
2. Use a Three `InstancedMesh` (or an installed Drei instancing primitive if its installed API is verified) for all same-material floor tiles.
3. Use the approved grid-cell-to-world coordinate transform and existing shared floor dimensions/thickness; top surfaces must align with the current floor level at y=0.
4. Set each instance matrix deterministically and update instance buffers correctly. Preserve shadows where useful.
5. Do not create one JSX mesh per tile, one material per tile, or per-tile React state.
6. Do not yet add wall instances, colliders, plinth, debug UI, or App integration.

---

## Acceptance criteria

- [ ] The rendered floor footprint matches `layout.floorCells` exactly.
- [ ] Floor instances align to the grid and remain centered under the fixed isometric camera.
- [ ] All floor tiles are batched into one or a small number of draw calls per material.
- [ ] No visual/physics collider is duplicated in this task.

---

## Verification

- Run all required checks and visually inspect the floor with a deterministic sample layout. Ask the user to verify the browser result.

---

## Important limits

- No useFrame work should be needed for static transforms.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
