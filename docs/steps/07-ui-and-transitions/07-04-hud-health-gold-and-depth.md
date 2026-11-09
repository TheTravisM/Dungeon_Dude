# Micro-step 07-04 — HUD: health, gold, and depth

---

**Parent phase:** Step 07-04  
**Task type:** CODE / UI  
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

Build the in-game HUD using SCSS Modules and existing aggregate/ECS data sources.

---

## Inspect first

- Hero health in ECS, gold/depth aggregate state in Zustand, `src/types/index.ts` (read only).
- Current screen-state model and UI overlay styles.
- SCSS variable mixins and current Vite injection behavior (read only).

---

## Exact scope

1. Create HUD component and `HUD.module.scss`.
2. Read health from the correct ECS/selector bridge without placing per-frame health in Zustand. Read gold and depth from existing aggregate store fields.
3. Display hearts/health, gold, and dungeon depth with accessible labels and robust empty/dead states.
4. Use semantic markup and keep the component under 200 lines.
5. Do not add inventory, map, pause menu, or final debug tools.

---

## Acceptance criteria

- [ ] HUD appears only while Playing.
- [ ] Health, gold, and depth reflect authoritative state.
- [ ] No unnecessary React renders from per-frame position/velocity changes.
- [ ] Controls/labels remain readable at desktop and narrow widths.

---

## Verification

- Run all required checks and browser-verify HUD data updates. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
