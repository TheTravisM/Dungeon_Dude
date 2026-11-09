# Micro-step 06-04 — Spatial grid/hash proximity index

---

**Parent phase:** Step 06-04  
**Task type:** CODE / PERFORMANCE  
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

Create a spatial grid/hash to query nearby monsters efficiently rather than scanning every monster for every interaction.

---

## Inspect first

- Miniplex monster queries and ECS entity position contract.
- Dungeon grid coordinate conversion.
- Approved Step 6 performance decision in AI_HANDOFF.

---

## Exact scope

1. Implement a pure, reusable spatial index keyed by grid/world buckets.
2. Support insert/update/remove and nearby-cell/radius query appropriate for the game.
3. Update it at a fixed/throttled interval, not once for every monster pair on every frame.
4. Handle entity removal and bucket migration without stale references.
5. Keep the index outside React state and avoid per-frame allocations.

---

## Acceptance criteria

- [ ] Nearby queries return expected candidates and exclude removed entities.
- [ ] Updating positions moves entities between buckets correctly.
- [ ] Query work is bounded by nearby buckets rather than O(n²) full scans.

---

## Verification

- Run all required checks. Describe a repeatable browser scenario for the final integration task; no new test dependency.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
