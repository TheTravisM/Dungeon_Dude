# Micro-step 04-10 — Development Stats and runtime physics-debug controls

---

**Parent phase:** Step 04-10  
**Task type:** CODE / DEV UI  
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

Add temporary development-only performance diagnostics and a runtime Rapier physics-debug toggle, defaulting from the existing environment setting.

---

## Inspect first

- Approved Step 4 tooling notes in `AI_HANDOFF.md`.
- `src/game/store.ts`, `src/types/index.ts` (read only), `GamePhysics.tsx`, `App.tsx`, `App.module.scss`, `src/vite-env.d.ts`, and installed Drei exports/types.

---

## Exact scope

1. Expose a small development overlay that can be opened/closed without changing the final HUD. Use existing `debugPanelOpen`, `physicsDebug`, and their declared store actions if baseline repair implemented them.
2. Wire the physics debug toggle to the live `<Physics debug={...}>` prop; the environment variable is only the initial default. It must work without restarting Vite.
3. Add Drei `<StatsGl />` if the installed package exports/supports it; otherwise use the installed `<Stats />` API and explain what it can/cannot display. Keep it off by default.
4. Only render the diagnostic overlay in development (`import.meta.env.DEV` or another already-approved development-only condition).
5. The existing UI layer has `pointer-events: none`; ensure only the actual debug controls opt back into pointer events.
6. Keep debug state out of per-frame game logic. Do not add diagnostics to the final HUD or change protected files.

---

## Acceptance criteria

- [ ] Stats are invisible by default and can be enabled deliberately in development.
- [ ] The physics debug switch toggles Rapier wireframes immediately at runtime.
- [ ] Initial physics-debug state respects `VITE_DEBUG_PHYSICS`.
- [ ] Controls are usable and do not block the game canvas when closed.
- [ ] No debug controls appear in production builds.

---

## Verification

- Run all required checks. Verify the development overlay, Stats, runtime wireframe toggle, and production-hidden behavior in the browser. Ask the user to confirm.

---

## Important limits

- Do not add another state library or put debug toggles in the final HUD.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
