# Micro-step 04-08 — One compound static Rapier collider

---

**Parent phase:** Step 04-08  
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

Replace per-tile collision ideas with one fixed Rapier rigid body containing the floor shape and merged wall-run colliders.

---

## Inspect first

- Approved 4.00 collider strategy.
- 4.05 `wallRuns` and layout fields.
- Existing `FloorCollider.tsx`, `GamePhysics.tsx`, and installed `@react-three/rapier` type definitions/docs.

---

## Exact scope

1. Create one focused dungeon collider component with exactly one fixed `<RigidBody>` for static level geometry.
2. Inside it, create the floor collider and one cuboid collider per merged wall run (or the approved shape strategy). Use `colliders={false}` when supplying explicit colliders.
3. Compute cuboid half-extents and positions from the `DungeonWallRun` fields and wall-height constants. Account for tall versus low wall heights.
4. Keep the rendered wall cutaway and its collider intentionally aligned; low visible ledges must still provide the approved physical boundary.
5. Do not create a RigidBody per tile, per wall, or per room. Do not use custom collision math.
6. Avoid duplicating the old `FloorCollider` rigid body. Refactor/reuse/remove it only as required for the single-body contract.

---

## Acceptance criteria

- [ ] There is exactly one static dungeon rigid body for level geometry.
- [ ] The hero floor surface is continuous and at y=0.
- [ ] Walls block movement at room/corridor boundaries and do not block openings.
- [ ] Rapier debug shapes correspond to visible dungeon geometry without per-tile rigid bodies.

---

## Verification

- Run all required checks. Start Vite and use the runtime/environment physics debug to inspect colliders; ask the user to verify the browser result.

---

## Important limits

- Verify exact `<RigidBody>` / `<CuboidCollider>` APIs against the installed Rapier 2.2.0 package.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
