# Micro-step 05-04 — Kinematic body and capsule collider

---

**Parent phase:** Step 05-04  
**Task type:** CODE / PHYSICS  
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

Add the hero’s Rapier kinematic-position rigid body and grounded capsule collider without yet implementing movement input.

---

## Inspect first

- Installed `@react-three/rapier` 2.2.0 type declarations/docs.
- Hero visual and ECS registration components.
- Dungeon compound collider and floor top/y conventions.
- Step 3 physics settings in AI_HANDOFF.

---

## Exact scope

1. Create a focused physics wrapper for the hero. Use the kinematic body type required by the approved low-level character-controller plan.
2. Use a capsule collider sized to one tile/hero model; no jumping. Confirm body/collider API against installed version.
3. Keep the body on the floor at rest and ensure the capsule starts at the generated spawn point with a correct center offset.
4. Do not implement movement, controller compute calls, WASD, or AI in this task.

---

## Acceptance criteria

- [ ] Hero stays grounded and does not fall through the static dungeon floor.
- [ ] Collider dimensions match the primitive model and approved scale.
- [ ] No separate custom collision math is introduced.

---

## Verification

- Run all required checks and browser-verify the grounded hero with physics debug. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
