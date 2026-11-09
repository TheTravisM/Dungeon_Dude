# Micro-step 08-03 — User-gesture audio unlock and audio controls

---

**Parent phase:** Step 08-03  
**Task type:** CODE / AUDIO  
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

Unlock the browser audio context from the Main Menu user gesture and provide basic mute/volume behavior.

---

## Inspect first

- Main Menu Enter Dungeon callback from Step 7.
- AudioManager and actual Howler API version.
- Current audio control/state patterns.

---

## Exact scope

1. Call the installed Howler unlock/resume path directly from the Enter Dungeon gesture, verified against installed docs/types.
2. Connect the unlock to the Main Menu start flow without delaying or duplicating the screen transition.
3. Add simple mute/volume controls only if already included in the approved design; keep their state infrequent and separate from per-frame game values.
4. Fail gracefully when browser audio is unavailable or blocked.

---

## Acceptance criteria

- [ ] First user click unlocks audio reliably in supported browsers.
- [ ] Sound effects play after the gesture.
- [ ] Mute/volume controls work and persist for the active session if that is the approved scope.

---

## Verification

- Run all required checks and browser-verify first-click audio unlock and mute behavior. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
