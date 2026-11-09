# Micro-step 07-02 — View Transitions API integration and reduced motion

---

**Parent phase:** Step 07-02  
**Task type:** CODE / WEB API  
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

Add a small transition helper that updates React screen state within the View Transitions API using flushSync, with a reduced-motion fallback.

---

## Inspect first

- 7.01 screen-state model.
- Installed TypeScript DOM types and current React 19 versions.
- Current `App.tsx` render structure.

---

## Exact scope

1. Feature-detect `document.startViewTransition` and use `flushSync` inside the callback so the DOM update is committed for the transition snapshot.
2. Respect `prefers-reduced-motion` and provide a direct state update fallback when unsupported or reduced motion is requested.
3. Keep transition names/styles minimal and in SCSS Modules.
4. Do not use GSAP/Framer Motion or another heavy DOM animation library.

---

## Acceptance criteria

- [ ] State changes animate when supported and motion is allowed.
- [ ] State changes still work in browsers without the API and when reduced motion is enabled.
- [ ] No React flush warnings or invalid transition ordering.

---

## Verification

- Run all required checks and browser-verify screen changes and reduced-motion fallback. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
