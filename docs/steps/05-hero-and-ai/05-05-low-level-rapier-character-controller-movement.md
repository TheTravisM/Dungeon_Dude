# Micro-step 05-05 — Low-level Rapier character-controller movement

---

**Parent phase:** Step 05-05  
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

Implement Rapier-computed character movement and apply its result to the hero’s kinematic-position rigid body.

---

## Inspect first

- Installed Rapier 2.2.0 and `@react-three/rapier` type declarations/docs.
- Current hero body/capsule wrapper.
- Approved character-controller decision in AI_HANDOFF: `world.createCharacterController()` and `computeColliderMovement` inside `useBeforePhysicsStep`.

---

## Exact scope

1. Create a focused hook/system for character-controller setup, movement computation, and disposal.
2. Use `useRapier().world.createCharacterController(offset)` and the supported `computeColliderMovement` flow inside `useBeforePhysicsStep`; verify exact signatures and cleanup against installed types.
3. Apply `computedMovement()` to the kinematic-position rigid body using its supported next-translation method.
4. Use Rapier for collision resolution. Do not implement custom collision math, raycasts, or a nonexistent React KinematicCharacterController component.
5. Keep movement vectors and body references outside React state.

---

## Acceptance criteria

- [ ] Movement delta is collision-resolved by Rapier.
- [ ] Hero cannot pass through walls and remains grounded.
- [ ] Controller resources are cleaned up.
- [ ] No per-frame allocations beyond what the installed API requires.

---

## Verification

- Run all required checks. Browser-verify movement against walls/corridors and no jumping; ask user to confirm.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
