# Micro-step 07-06 — Responsive polish, accessibility, and Step 7 acceptance

---

**Parent phase:** Step 07-06  
**Task type:** ACCEPTANCE / UI  
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

Finish responsive layout, container-query behavior, accessible state changes, and end-to-end acceptance for all three screens.

---

## Inspect first

- All Step 7 UI components and SCSS Modules.
- Existing global variables and Vite SCSS configuration (read only).

---

## Exact scope

1. Apply container queries for health hearts/gold counters where appropriate.
2. Check focus states, keyboard interaction, semantic labels, color contrast, and reduced motion.
3. Use native popovers only for suitable tooltip/item details; do not add TTS dialogue (Step 8).
4. Verify the View Transitions API path and unsupported/reduced-motion fallback.
5. Run full checks and update AI_HANDOFF only after user approval.

---

## Acceptance criteria

- [ ] MainMenu → Playing → GameOver → restart/return flows work.
- [ ] UI is responsive and accessible.
- [ ] No heavy DOM animation dependency or per-frame game state in React UI.
- [ ] User approves the complete Step 7 result.

---

## Verification

- Full checks and browser acceptance required.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
