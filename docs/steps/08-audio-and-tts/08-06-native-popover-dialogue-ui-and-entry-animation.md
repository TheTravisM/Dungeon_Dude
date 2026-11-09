# Micro-step 08-06 — Native popover dialogue UI and entry animation

---

**Parent phase:** Step 08-06  
**Task type:** CODE / UI  
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

Display the current Deckard Cain line in an accessible native popover with CSS entry animation.

---

## Inspect first

- Verified dialogue data/playback interface from 8.04–8.05.
- Existing SCSS variables and component conventions.
- Browser support constraints for native popovers and `@starting-style`.

---

## Exact scope

1. Create a focused dialogue component and SCSS Module using the native HTML popover attribute.
2. Use `@starting-style` for entry animation with a reduced-motion fallback.
3. Update text from the approved playback/queue interface and close/hide safely when playback ends or is cancelled.
4. Keep accessibility semantics and avoid introducing a popover library or DOM animation library.
5. Do not implement new audio request/queue behavior here.

---

## Acceptance criteria

- [ ] Dialogue appears only when a line is presented and closes safely.
- [ ] Text is readable and accessible.
- [ ] Native popover and entry animation work in supported browsers, with fallback styling.
- [ ] Reduced-motion disables or minimizes the transition.

---

## Verification

- Run all required checks and browser-verify dialogue open/close, long text, and reduced-motion. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
