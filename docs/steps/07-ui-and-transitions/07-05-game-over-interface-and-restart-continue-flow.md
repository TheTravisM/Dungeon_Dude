# Micro-step 07-05 — Game Over interface and restart/continue flow

---

**Parent phase:** Step 07-05  
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

Build the Game Over screen and connect it to the explicit screen-state transition model.

---

## Inspect first

- 7.01 state model and 7.02 transition helper.
- Hero death/game state signal and aggregate counters.
- MainMenu component styling conventions.

---

## Exact scope

1. Create focused GameOver component and SCSS Module.
2. Show appropriate summary data that already exists (e.g. depth, gold, monsters slain); do not add new persistent statistics.
3. Implement the approved restart/return action using explicit screen transitions and existing game-reset contracts. If reset behavior is not defined, ask one concise question rather than inventing persistence semantics.
4. Do not implement audio/voice.

---

## Acceptance criteria

- [ ] GameOver is shown on the agreed death condition.
- [ ] Action returns to the agreed next state and resets only the values defined by the existing game contract.
- [ ] View transitions and reduced-motion fallback work.

---

## Verification

- Run all required checks and browser-verify game-over/restart. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
