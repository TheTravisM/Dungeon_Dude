# Micro-step 08-05 — TTS queue, cancellation, caching, and sound ducking

---

**Parent phase:** Step 08-05  
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

Add sequential TTS playback, cancellation, audio caching, and reduced sound-effect volume while Cain speaks.

---

## Inspect first

- TTS client from 8.04 and AudioManager from 8.01–8.03.
- Verified TTS response format and Howler audio control APIs.
- Approved Step 8 handoff notes.

---

## Exact scope

1. Implement a single queue so simultaneous lore requests do not overlap or speak out of order.
2. Support cancellation/abort and prevent stale queued lines from playing after screen changes or user cancellation.
3. Cache returned audio using a bounded in-memory policy appropriate to actual response type/size. Avoid unbounded memory growth.
4. Duck sound effects while TTS is active and restore the prior volume even on error/cancel.
5. Keep queue state outside React render loops; expose only coarse playback status to UI.

---

## Acceptance criteria

- [ ] Cain lines play sequentially.
- [ ] Cancel/abort prevents later stale playback.
- [ ] Cache hits avoid redundant API requests and cache size is bounded.
- [ ] Sound effects duck and reliably restore their previous level on success, failure, or cancellation.

---

## Verification

- Run all required checks and browser-verify overlapping requests, cancellation, cache hit, and ducking. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
