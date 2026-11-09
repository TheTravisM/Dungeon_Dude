# Micro-step 05-03 — Hero Miniplex lifecycle registration

---

**Parent phase:** Step 05-03  
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

Register exactly one hero entity in the module-level Miniplex world and remove it cleanly when the component unmounts.

---

## Inspect first

- `src/game/ecs.ts`, `src/types/index.ts` (read only), `Hero.tsx`, and React StrictMode entry point.

---

## Exact scope

1. Use the existing `createHero` factory and existing `heroQuery`; do not create another World or React binding.
2. Register on mount and remove the exact returned entity on cleanup. Make lifecycle resilient to React StrictMode mount/cleanup behavior.
3. Keep mutable position/velocity/health on ECS entity/refs, not Zustand or React state.
4. Keep the Hero render component separate from entity lifecycle if needed; do not add movement logic yet.

---

## Acceptance criteria

- [ ] Exactly one active hero entity exists after mount.
- [ ] Unmount/cleanup removes that entity without leaking duplicates.
- [ ] Existing monster/prop queries and factories remain unchanged.

---

## Verification

- Run all required checks. Verify mount/cleanup through a temporary safe diagnostic or existing dev tools; remove temporary diagnostics before finish.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
