# Micro-step 05-09 — Step 5 integration and acceptance

---

**Parent phase:** Step 05-09  
**Task type:** ACCEPTANCE  
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

Verify the hero’s visuals, torch, physics, ECS lifecycle, manual input, and autonomous exploration as one working feature.

---

## Inspect first

- All Step 5 components/hooks/modules and relevant AI_HANDOFF sections.
- Dungeon integration and debug overlay from Step 4.

---

## Exact scope

1. Verify spawn alignment, grounded movement, wall collisions, torch lighting, ECS uniqueness/cleanup, WASD override, exact four-second idle return, pathfinding, and stuck recovery.
2. Run all required verification commands and report warnings/failures precisely.
3. Update AI_HANDOFF current status/next step only after user browser approval. Do not begin monsters or combat.

---

## Acceptance criteria

- [ ] All listed hero behaviors work in the browser.
- [ ] No per-frame spatial data is placed in React state/Zustand.
- [ ] No future Step 6/7/8 features are present.
- [ ] User approves the complete Step 5 result.

---

## Verification

- Full checks plus browser acceptance required.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
