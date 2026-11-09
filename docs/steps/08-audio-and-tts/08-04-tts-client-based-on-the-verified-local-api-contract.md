# Micro-step 08-04 — TTS client based on the verified local API contract

---

**Parent phase:** Step 08-04  
**Task type:** CODE / TTS  
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

Implement a small Deckard Cain TTS client using only the request/response contract established in 8.00.

---

## Inspect first

- Approved 8.00 API contract and server source/docs findings.
- Existing `VITE_TTS_API_URL` typing and current environment usage (read only).
- Installed browser fetch/AbortController types.

---

## Exact scope

1. Implement a focused TTS client module that accepts text and returns/streams audio exactly as the verified endpoint supports.
2. Use `AbortController`, a finite timeout, typed error handling, and clear offline behavior.
3. Do not put a guessed body field, endpoint path, header, audio MIME type, or response parsing logic into the implementation.
4. Do not modify `.env.development` or expose secrets.
5. Keep fetch/API code independent of UI components.

---

## Acceptance criteria

- [ ] Request matches the verified server contract exactly.
- [ ] Successful audio is parsed using the verified response type.
- [ ] Timeout, cancellation, HTTP errors, malformed responses, and server-offline behavior are handled.
- [ ] No unhandled promise rejections or noisy user-facing crash.

---

## Verification

- Run all required checks. Browser-verify against the local TTS service if available; if offline, verify graceful failure and report that live voice playback remains unverified.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
