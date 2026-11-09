# Micro-step 07-01 — Screen-state model and transition boundaries

---

**Parent phase:** Step 07-01  
**Task type:** CODE / STATE  
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

Define a small typed screen-state model for MainMenu, Playing, and GameOver without mixing screen state with per-frame game data.

---

## Inspect first

- Current `App.tsx`, `App.module.scss`, `src/game/store.ts`, and existing `GameState` type (read only).
- Current hero/monster death and level progression events.

---

## Exact scope

1. Create a focused screen-state model using a local typed union or an existing appropriate infrequent UI-state store.
2. Avoid editing protected `src/types/index.ts`; keep screen state in a new local UI module or component state.
3. Define explicit allowed transitions and the event boundaries that trigger them.
4. Keep positions, velocities, health ticks, and combat state outside the screen-state model.

---

## Acceptance criteria

- [ ] Only MainMenu, Playing, and GameOver are represented.
- [ ] Transitions are explicit and type-safe.
- [ ] No visual transition code or complete screens are implemented yet.

---

## Verification

- Run all required checks.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
