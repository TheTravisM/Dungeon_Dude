# Micro-step 06-09 — Step 6 integration and acceptance

---

**Parent phase:** Step 06-09  
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

Verify monster spawn, proximity, aggro, movement, attacks, damage, combat feedback, death, and cleanup as one working system.

---

## Inspect first

- All Step 6 modules and relevant Step 5 hero/controller modules.
- INDEX and AI_HANDOFF Step 6 decisions.

---

## Exact scope

1. Run a reproducible seed scenario and verify monster placement, spawn count, aggro radii, navigation, Rapier collisions, one-hit-per-swing, damage, knockback, cooldowns, death, and cleanup.
2. Check performance behavior with development Stats: draw calls, frame time, and no obvious quadratic proximity spikes.
3. Run all required checks. Update AI_HANDOFF status and next step only after user approval.

---

## Acceptance criteria

- [ ] All Step 6 acceptance behaviors work.
- [ ] No future Step 7 HUD or Step 8 audio features are introduced.
- [ ] User approves the complete Step 6 result.

---

## Verification

- Full checks plus browser acceptance required.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
