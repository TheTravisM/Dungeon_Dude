# Micro-step 08-00 — Read-only asset and TTS API contract audit

---

**Parent phase:** Step 08-00  
**Task type:** READ-ONLY / DESIGN  
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

Inspect available sound assets and determine the actual local TTS endpoint contract before writing audio/TTS code.

---

## Inspect first

- Relevant `.env.development` keys only; do not copy or expose values that are secrets.
- `public/assets/` directory tree and current project audio-related code.
- `package.json`/lockfile, existing `howler` dependency, Step 8 plan and AI_HANDOFF entries.
- If TTS server source/docs are part of the workspace, inspect only the route/schema that implements the configured endpoint.

---

## Exact scope

1. List available audio assets, file formats, approximate sizes, and naming conventions.
2. Identify the configured `VITE_TTS_API_URL` key without modifying `.env.development`; establish its actual runtime value locally only if available and safe to report.
3. Determine request method, headers, body schema, response content type/format, streaming versus whole-blob behavior, error responses, and whether cancellation is supported from server source/docs or a safe local test.
4. Do not guess a payload or assume an XTTS/Qwen endpoint. If the API implementation is not in the repo and no contract docs exist, report the exact missing contract and ask for the one required source/document.
5. Propose a minimal AudioManager/TTS architecture and caching boundary.

---

## Acceptance criteria

- [ ] No files are changed.
- [ ] Asset inventory is accurate.
- [ ] Every API-contract statement is backed by inspected server source/docs or an explicitly reported safe test.
- [ ] Unknowns are clearly identified, not invented.
- [ ] User approves the API contract/design before implementation.

---

## Verification

- Read-only inspection only; no code checks or browser test required.

---

## Important limits

- This task is the Step 8 gate. Do not write `AudioManager.ts` or TTS code until the API contract is known.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
