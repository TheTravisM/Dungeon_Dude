# 05-00 Preflight, dependencies, and test runner

**Type:** SETUP (touches protected files; the user has authorized every edit listed here)
**Depends on:** Step 4 approved and committed.
**Rules:** `docs/steps/INDEX.md`. Read `docs/steps/05-hero-and-ai/STEP-5-CONTRACT.md` sections 1 and 6.4 only.

## Goal

Make the repo ready for Step 5 in one controlled change: install the three approved packages, add the test runner, extend the hero entity type, and record the Step 5 decisions.

## Gate (stop and report if any fail)

1. `git status --short` is clean and `git log --oneline -3` shows the Step 4 commit.
2. `docs/steps/INDEX.md` has 4.00 through 4.12 ticked and `AI_HANDOFF.md` says Step 4 is complete.
3. Baseline passes: `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, `node scripts/verify-dungeon.mjs`.

## Edits (all authorized)

1. Install, exact versions:
   ```powershell
   npm install mistreevous@4.3.1 maath@0.10.8
   npm install -D vitest@^3.2.7
   ```
   Do not install Vitest 4 or 5 (they need Vite 6 or later). Do not install `ngraph.path`, `yuka`, `navcat`, or `@miniplex/*`.
2. `package.json`: add the script `"test": "vitest run"`. Change nothing else by hand.
3. Create `vitest.config.ts` at the repo root so tests never load the React Compiler or SCSS setup:
   ```ts
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       environment: 'node',
       include: ['src/**/*.test.ts'],
     },
   });
   ```
4. `src/types/index.ts`: add one optional field to `Entity` under "Spatial data":
   ```ts
   /** Facing in radians around Y. 0 faces +Z. */
   heading?: number;
   ```
5. `src/game/ecs.ts`: in `createHero`, add `heading: 0` to the initial object so the entity shape never changes later. Touch nothing else in the file.
6. Add `src/game/hero/ai/mistreevous.test.ts` that pins the library behavior the brain relies on. Use `import { describe, expect, it } from 'vitest'` and `import { BehaviourTree, State } from 'mistreevous'`. Use this tree for all cases:
   `root { selector { sequence { condition [HasRoute] action [Follow] } action [Plan] } }`
   - Fallthrough: `HasRoute` returns false, `Plan` returns `State.SUCCEEDED`. After one `step()`, only `Plan` ran.
   - Self-restart: a second `step()` after a finished tree runs `Plan` again.
   - Running revisit: `HasRoute` true, `Follow` returns `State.RUNNING` twice then `State.SUCCEEDED`. After three `step()` calls, `HasRoute` was evaluated once and `Follow` three times.
   - Failure falls through in the same tick: `Follow` returns `State.RUNNING` once then `State.FAILED`. On the second `step()`, the log shows `Follow` failed and then `Plan` ran.
   - Options: `new BehaviourTree('root { action [A] }', agent, { random: () => 0.5 })` constructs and steps.
   These were verified against 4.3.1 on 2026-11-09. If any case fails, stop and report it.
7. `docs/steps/INDEX.md` (the Step 5 table and the shared-reference line were already rewritten when this plan was written; do not touch them). Make only these edits:
   - In "Protected files and dependency control" (the bullet "Vitest is not installed..."), replace it with: `Vitest 3.x was approved and installed in 5.00 for pure logic modules (Vite 5 requires Vitest 3; do not upgrade). Run npm test with the other checks whenever a task adds or changes tests.`
   - Replace the later bullet "There is no Vitest dependency." with: `Vitest 3.x is installed (see 5.00).`
   - In the required verification block, add `npm test` after `npm run lint`.
   - Add one line under the Step 5 table: `Shared reference for all Step 5 tasks: docs/steps/05-hero-and-ai/STEP-5-CONTRACT.md.`
8. `AI_HANDOFF.md`: append a new subsection `### 2.19 Step 5 decisions (2026-11-09)` at the end of section 2, with 8 to 10 short bullets copied from the contract section 1 table (one per row) plus: corridors are one tile wide so the hero uses radius 0.28 and controller offset 0.02; idle return is 4000 ms and lives only in `HERO_IDLE_RETURN_MS`; Zustand is written only on mode flips. Do not rewrite older text.

## Acceptance

- [ ] Gate checks passed before any edit.
- [ ] `package.json` differs only by the three dependencies and the `test` script.
- [ ] `npm test` passes with the five mistreevous cases.
- [ ] `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, `node scripts/verify-dungeon.mjs`, `git diff --check` all pass.
- [ ] `npm run build` succeeds with `mistreevous` imported only from the test file; the first real browser import is checked in 5.13.

## Not in this task

Any hero code, component, or hook. No browser check is needed. Do not tick the checklist, update the handoff log, or commit until the user approves.
