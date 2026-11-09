# Micro-step 05-02 — Torch visuals and efficient lighting

---

**Parent phase:** Step 05-02  
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

Attach a handheld torch effect to the hero without an unnecessarily expensive point-light shadow setup.

---

## Inspect first

- Hero visual component.
- Existing `Lighting.tsx`, `Effects.tsx`, and current Three/R3F/Drei versions.
- Approved lighting recommendations in AI_HANDOFF.

---

## Exact scope

1. Add a small emissive torch/flame visual attached to the hero hierarchy.
2. Prefer a spotlight with one shadow map, or a point light without shadows plus emissive flame, as approved by the handoff. If choosing spotlight shadows, limit map resolution and casters.
3. Add only subtle deterministic flicker if it can be done without per-frame allocations. Keep animation logic in a focused hook/ref, not the render component.
4. Do not add global bloom or a new effect pipeline.

---

## Acceptance criteria

- [ ] Torch stays attached to the hero when it moves.
- [ ] Torch clearly lights nearby dungeon geometry without washing out the palette.
- [ ] Shadow cost is limited and the existing post-processing remains intact.

---

## Verification

- Run all required checks and visually inspect lighting/shadows in the browser. Ask user to verify.

---

## Finish and report

When this micro-step is implemented, report the changed files, the important decisions made, each verification command result, and any known limitation. For visual/physics/audio tasks, give the user the exact browser steps needed. Then wait for explicit user approval. Do not update the checklist/handoff, create a commit, mark a parent phase complete, or start the next micro-step until that approval is received.
