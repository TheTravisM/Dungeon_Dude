# Micro-step 05-08 — Autonomous exploration, idle return, and stuck recovery

---

**Parent phase:** Step 05-08  
**Task type:** CODE / AI  
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

Add autonomous movement through the dungeon, manual override, four-second idle return, throttled replanning, and stuck recovery.

---

## Inspect first

- Pathfinding module from 5.07.
- Manual input from 5.06.
- Hero controller from 5.05.
- Existing Miniplex and Zustand contracts.
- Approved AI notes in AI_HANDOFF.

---

## Exact scope

1. Implement autonomous exploration goals using walkable rooms/cells; do not add loot/enemy engagement until Step 6 provides those entities.
2. Use cached waypoints and replan at the approved 4–10 Hz interval, not every frame.
3. After four seconds without manual input, return to autonomous mode using the shared `lastInputTime` contract.
4. Add stuck detection and a deterministic fallback waypoint/goal.
5. Keep all changing navigation state in refs/ECS; Zustand only stores the coarse manual/autoplay mode.
6. Do not implement combat or monster behavior.

---

## Acceptance criteria

- [ ] Hero explores only walkable floor cells and respects Rapier collision.
- [ ] WASD immediately interrupts autonomy.
- [ ] After four idle seconds autonomy resumes.
- [ ] Pathfinding is throttled and does not run every frame.
- [ ] Stuck detection prevents endless movement against walls.

---

## Verification

- Run all required checks and browser-verify manual override, idle return, collision, and stuck recovery. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
