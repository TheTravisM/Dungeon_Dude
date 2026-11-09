# Micro-step 06-06 — Rapier sensor-based sword hit detection

---

**Parent phase:** Step 06-06  
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

Implement sword attack hit detection using Rapier sensor colliders/intersection events rather than custom raycasts.

---

## Inspect first

- Installed Rapier 2.2.0 type declarations/docs.
- Hero attack state/input conventions.
- Monster ECS entity contract and spatial hash.

---

## Exact scope

1. Create a focused attack sensor attached to the hero/weapon with the correct Rapier sensor/intersection API verified against installed types.
2. Use intersection events to identify eligible monsters in range.
3. Prevent repeated damage from one swing using a per-attack hit set/identifier and clear it at the correct lifecycle boundary.
4. Do not hand-roll raycasts, collision geometry, or O(n²) scans.
5. Do not yet add complex VFX or health HUD.

---

## Acceptance criteria

- [ ] Only monsters intersecting the active attack sensor are hit.
- [ ] One swing cannot apply duplicate hits to the same monster.
- [ ] Sensor cleanup is reliable and sensor itself does not physically block movement.

---

## Verification

- Run all required checks and browser-verify attack hit windows/collision. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
