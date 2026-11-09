# Micro-step 07-03 — Main Menu interface and start flow

---

**Parent phase:** Step 07-03  
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

Build the Main Menu screen and a user-initiated Enter Dungeon action that transitions to Playing.

---

## Inspect first

- 7.01 state model and 7.02 transition helper.
- Existing SCSS tokens, `App.module.scss`, canvas/overlay layering.
- Audio-unlock handoff note (actual audio unlock implementation remains Step 8).

---

## Exact scope

1. Create focused MainMenu component and `*.module.scss`.
2. Add clear game title and Enter Dungeon control.
3. The button must trigger the approved screen transition. It may expose a callback for Step 8 audio unlock, but do not implement Howler/TTS here.
4. Ensure UI controls receive pointer events even if the general overlay layer uses `pointer-events: none`.
5. Keep layout responsive and avoid external assets/fonts.

---

## Acceptance criteria

- [ ] Main Menu appears in initial state and Enter Dungeon transitions to Playing.
- [ ] Button is keyboard accessible and usable at common viewport sizes.
- [ ] No audio network call or future HUD work is introduced.

---

## Verification

- Run all required checks and browser-verify initial menu/start flow. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
