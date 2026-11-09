# Micro-step 08-07 — Step 8 end-to-end audio/TTS acceptance

---

**Parent phase:** Step 08-07  
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

Verify static sound, user-gesture audio unlock, queued Deckard Cain TTS, cancellation, caching, ducking, dialogue UI, and offline failure behavior together.

---

## Inspect first

- All Step 8 modules and the exact server contract from 8.00.
- Main Menu and game state flows from Step 7.

---

## Exact scope

1. Run the full user flow from Main Menu click through sound unlock and a TTS voice line.
2. Verify two or more requested lines queue without overlap, cancellation stops stale lines, cache behaves as designed, sound-effect ducking restores volume, and dialogue closes appropriately.
3. Disable/stop the TTS server and verify the game continues without crashing or blocking gameplay.
4. Run full TypeScript/lint/build/diff checks. Update AI_HANDOFF status/next step only after the user accepts the browser results.
5. Do not add additional features from the backlog during acceptance.

---

## Acceptance criteria

- [ ] Audio and TTS work against the verified local service contract.
- [ ] Offline TTS failure is graceful.
- [ ] No overlapping voices, stuck ducked volume, unhandled rejection, or resource leak is observed.
- [ ] User approves the complete Step 8 result.

---

## Verification

- Full checks plus browser/audio acceptance required.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
