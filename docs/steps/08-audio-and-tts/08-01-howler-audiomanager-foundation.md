# Micro-step 08-01 — Howler AudioManager foundation

---

**Parent phase:** Step 08-01  
**Task type:** CODE  
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

Create a focused Howler-based AudioManager that centralizes sound playback and lifecycle.

---

## Inspect first

- Approved 8.00 architecture.
- Actual audio assets inventory from 8.00.
- Installed `howler` and `@types/howler` versions.

---

## Exact scope

1. Create `src/game/AudioManager.ts` or the approved path.
2. Centralize Howler setup, sound registration, play/stop, volume/mute, and disposal.
3. Use real asset paths discovered in 8.00; do not invent files or rename assets.
4. Keep AudioManager independent of React and avoid storing audio objects in Zustand.
5. Do not implement user gesture unlock, TTS, queue, or dialogue UI yet.

---

## Acceptance criteria

- [ ] AudioManager loads only known assets.
- [ ] Playback/stop/disposal is centralized and type-safe.
- [ ] No React dependency is imported.
- [ ] Missing assets fail gracefully with useful development diagnostics.

---

## Verification

- Run all required checks. Verify one known local sound through a temporary development path only if available; remove temporary test code before finish.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
