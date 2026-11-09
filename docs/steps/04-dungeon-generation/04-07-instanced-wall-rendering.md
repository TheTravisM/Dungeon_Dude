# Micro-step 04-07 — Instanced wall rendering

---

**Parent phase:** Step 04-07  
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

Render all generated wall cells with instancing and visually validate precomputed cutaway heights.

---

## Inspect first

- Approved 4.00 wall dimensions/material choices.
- 4.05 wallCells/wallRuns output.
- 4.06 floor renderer.
- Camera and lighting components.

---

## Exact scope

1. Create a focused wall renderer.
2. Batch wall instances by geometry/material/height category (for example one batch for tall walls and one for low ledges).
3. Use stable transforms matching the grid coordinate convention.
4. Preserve useful cast/receive shadows without unnecessarily turning every small object into a shadow caster.
5. Do not create a transparent wall fade system or per-frame occlusion/raycast logic.
6. Do not add Rapier colliders in this micro-step.

---

## Acceptance criteria

- [ ] Every generated wall cell appears exactly once in the expected visual batch.
- [ ] Tall/low edges read correctly from the fixed camera.
- [ ] Rooms and corridors are visibly legible; entrances are not visually blocked.
- [ ] Wall rendering uses instancing, not one independent React mesh per wall tile.

---

## Verification

- Run all required checks and visually inspect the complete rendered wall arrangement. Ask the user to verify the browser result.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
