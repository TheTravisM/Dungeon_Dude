# Micro-step 08-02 — Sound-effect loading, playback, and disposal

---

**Parent phase:** Step 08-02  
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

Connect actual game events to registered sound effects with safe loading, playback, and cleanup.

---

## Inspect first

- AudioManager from 8.01 and verified asset inventory.
- Hero/monster/game event boundaries from Steps 5–7.

---

## Exact scope

1. Register the appropriate real static sound effects and configure volume/rate defaults.
2. Provide narrow event-facing methods for game systems; do not expose raw Howler instances across the app.
3. Handle load errors and cleanup/disposal. Avoid creating a new Howl object on each event.
4. Do not start TTS playback or queue logic yet.

---

## Acceptance criteria

- [ ] Known effects play on their intended event and stop/dispose correctly.
- [ ] No missing or fabricated asset paths.
- [ ] Audio objects are reused rather than recreated on every event.

---

## Verification

- Run all required checks and browser-verify sound effects. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
