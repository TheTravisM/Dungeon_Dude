# Micro-step 06-02 — Monster visual component

---

**Parent phase:** Step 06-02  
**Task type:** CODE / VISUAL  
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

Create the focused Monster rendering component using grouped primitive geometry and archetype appearance.

---

## Inspect first

- Monster archetype definitions from 6.01.
- Hero visual scale and current dungeon palette/lighting.

---

## Exact scope

1. Create a rendering-focused Monster component that accepts typed visual/archetype props.
2. Use grouped primitives with a readable silhouette distinguishable from the hero.
3. Do not register ECS entities, spawn monsters, manage health, or implement AI in this component.
4. Keep shadows/materials economical and component under 200 lines.

---

## Acceptance criteria

- [ ] Monster visuals render at supplied positions and scale.
- [ ] At least the approved initial archetypes are visually distinguishable.
- [ ] Rendering stays separate from gameplay state.

---

## Verification

- Run all required checks and visually inspect monster appearances. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
