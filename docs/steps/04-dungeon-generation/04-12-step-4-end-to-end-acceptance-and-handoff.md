# Micro-step 04-12 — Step 4 end-to-end acceptance and handoff

---

**Parent phase:** Step 04-12  
**Task type:** ACCEPTANCE / RELEASE GATE  
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

Verify the entire dungeon-generation phase as one coherent system, document its final architecture, and prepare the project for Step 5 without implementing any Step 5 features.

---

## Inspect first

- Relevant Step 4 entries in INDEX, `AI_HANDOFF.md`, `App.tsx`, all dungeon generation/render/collider modules, `GamePhysics.tsx`, and `package.json`/lockfile read only.

---

## Exact scope

1. Run the full deterministic dungeon through several fixed seeds using the approved seed interface or debug mechanism. Verify same-seed reproducibility and different-seed variation without changing dependencies.
2. Verify every room is reachable, all corridors are open, boundaries/walls are correct, and spawn is on a walkable cell.
3. Verify cutaway orientation from the fixed camera, static collider alignment, plinth silhouette, Stats disabled by default, and runtime physics debug behavior.
4. Run TypeScript, lint, build, and `git diff --check`. Report all output and known non-blocking warnings.
5. Delete or hide any remaining temporary-only development probes. Keep approved Stats/physics debug tools development-only.
6. Update the Step 4 current status in AI_HANDOFF, record the final generator/geometry/collider/seed decisions, and set Step 5 as the next task. Do this only after user verification and approval.

---

## Acceptance criteria

- [ ] Step 4 passes all checks and user browser acceptance.
- [ ] The final dungeon is deterministic, connected, visually legible, performant through instancing, and physically bounded.
- [ ] No hero, monster, combat, final HUD, or audio features have been started.
- [ ] AI_HANDOFF accurately says Step 4 is complete and Step 5 is next.
- [ ] Only after explicit user approval may Step 4 be marked complete and the final commit be created.

---

## Verification

- Full TypeScript/lint/build checks and browser acceptance required. Provide a manual checklist with exact seed/controls and ask the user to approve.

---

## Important limits

- This is the only Step 4 micro-step allowed to mark the parent Step 4 complete.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
