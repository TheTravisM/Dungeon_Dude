# Micro-step 04-03 — Bounded, non-overlapping room placement

---

**Parent phase:** Step 04-03  
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

Generate valid rectangular rooms inside the 20×20 grid using the approved seeded random source.

---

## Inspect first

- Approved 4.00 dungeon design.
- Existing `DungeonRoom`, `GridCell`, `DungeonLayout` definitions in `src/types/index.ts` (read only).
- The 4.02 configuration and PRNG modules.

---

## Exact scope

1. Implement room placement as a pure function.
2. Guarantee every room is within bounds and rooms do not overlap; enforce the approved spacing/margin rule.
3. Use only the deterministic PRNG passed from the caller. Do not read `Math.random()` or current time.
4. Bound attempts and provide a deterministic fallback/error if the target room count cannot be placed. Never enter an infinite retry loop.
5. Return rooms in a stable deterministic order and populate `center` correctly. Do not yet carve corridors or generate walls.

---

## Acceptance criteria

- [ ] For a fixed seed and config, room arrays are identical across runs.
- [ ] Every room satisfies the configured min/max dimensions and grid bounds.
- [ ] No two room rectangles violate the approved overlap/spacing rule.
- [ ] Failure to fit is explicit and recoverable; it does not silently return a malformed layout.

---

## Verification

- Run all required checks. Use the 4.12 browser/seed verification for rendered validation; do not add Vitest.

---

## Important limits

- Use small pure helper functions and keep the file under 200 lines.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
