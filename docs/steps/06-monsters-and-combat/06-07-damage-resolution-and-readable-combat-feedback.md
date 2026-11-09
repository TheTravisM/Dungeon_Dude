# Micro-step 06-07 — Damage resolution and readable combat feedback

---

**Parent phase:** Step 06-07  
**Task type:** CODE / GAMEPLAY  
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

Centralize damage resolution and add readable attack wind-up, cooldown, hit flash, knockback, and brief invulnerability.

---

## Inspect first

- 6.06 hit events, monster stats, hero/monster ECS data, Zustand aggregate actions.
- Existing project visual palette and Rapier movement conventions.

---

## Exact scope

1. Create a focused combat/damage system outside render components.
2. Apply damage once per valid hit, respect invulnerability/cooldowns, and update aggregate gold/monster count only through existing store actions when appropriate.
3. Implement attack telegraph/wind-up, cooldown, hit flash, knockback, and brief invulnerability frames.
4. Keep per-entity health and knockback data in ECS/refs, not Zustand.
5. Avoid introducing new animation dependencies.

---

## Acceptance criteria

- [ ] Damage is deterministic and applied once per valid hit.
- [ ] Cooldown and invulnerability prevent repeated rapid damage.
- [ ] Hit/knockback feedback is visible and does not break Rapier movement.
- [ ] Aggregate counters remain consistent.

---

## Verification

- Run all required checks and browser-verify attack timing, hits, knockback, and feedback. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
