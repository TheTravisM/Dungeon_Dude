# Micro-step 05-06 — WASD input and manual-control override

---

**Parent phase:** Step 05-06  
**Task type:** CODE / INPUT  
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

Implement keyboard input that temporarily takes control from autonomous movement and records the last user-input time.

---

## Inspect first

- Current character-controller movement hook.
- `src/game/store.ts` and its typed actions.
- Cline/browser keyboard interaction constraints and existing UI overlay behavior.

---

## Exact scope

1. Create a focused input hook/module that maps WASD to normalized world/grid movement consistent with camera controls.
2. On valid movement input, set manual mode and update last-input timestamp through existing store actions.
3. Prevent key handling when focus is inside editable form controls or when the game is not in Playing state (if screen state already exists).
4. Remove event listeners on cleanup and avoid duplicate listeners in StrictMode.
5. Do not implement autonomous pathfinding or monster AI here.

---

## Acceptance criteria

- [ ] WASD moves the hero predictably in the isometric world.
- [ ] Manual input takes control immediately.
- [ ] Keyboard events do not trigger unwanted page scrolling or interfere with future UI inputs.
- [ ] The existing 4-second idle threshold is not duplicated in multiple modules.

---

## Verification

- Run all required checks and browser-verify keyboard controls. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
