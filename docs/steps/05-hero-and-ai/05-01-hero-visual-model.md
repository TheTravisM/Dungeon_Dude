# Micro-step 05-01 — Hero visual model

---

**Parent phase:** Step 05-01  
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

Create the hero’s grouped primitive-box visual model as a focused rendering component.

---

## Inspect first

- Dungeon layout and spawn output from Step 4.
- `src/types/index.ts` (read only), `src/game/ecs.ts`, scene lighting and materials.

---

## Exact scope

1. Create `Hero.tsx` or the approved hero component path using grouped primitive meshes.
2. Keep mesh composition/materials/shadows in the visual component only. Do not add movement, ECS registration, physics, keyboard listeners, or AI.
3. Use a clear silhouette and scale that fits one dungeon tile and the approved capsule dimensions.
4. Use existing palette conventions; do not add external assets or dependencies.

---

## Acceptance criteria

- [ ] Hero renders at the supplied world position with a readable silhouette from the fixed camera.
- [ ] Component remains focused and under 200 lines.
- [ ] No gameplay state or movement code is embedded in the visual model.

---

## Verification

- Run all required checks and visually inspect the hero in the dungeon. Ask user to verify.

---

## Important limits

- Use the Step 4 approved world-coordinate convention.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
