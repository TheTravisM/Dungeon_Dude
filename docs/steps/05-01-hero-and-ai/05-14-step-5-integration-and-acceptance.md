# 05-14 Step 5 integration and acceptance

**Type:** VERIFICATION (small fixes only)
**Depends on:** 05-13 approved.
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 3, 4, 7, and 8 only.

## Goal

Prove Step 5 works as a whole, remove temporary probes, and prepare for Step 6. No new features.

## Do

1. **Headless exploration test.** Add `src/game/hero/ai/exploreSim.test.ts` (Vitest). Without React or physics, simulate a point mass at `HERO_SPEED` over 60 Hz steps for seeds 1 to 50: use `createExploreState`, `pickNextRoom`, `planWorldPath`, `smoothPath`, and `directionToWaypoint` exactly as the brain does. Assertions per seed:
   - Every room is visited within a generous step budget (for example 60 simulated seconds per room).
   - At every simulated step the point sits on a walkable cell (`worldToGrid` then `isWalkable`).
   - No route is ever `null` for a reachable room.
2. **Clean up.** Search for and remove: `TEMP` comments, temporary `console.*` probes and counters, unused refs, and dead imports. Keep the dev-only readout, path overlay, and the "Route to random room" Dev tool (all are gated by `import.meta.env.DEV`).
3. **Production build check.** `npm run build`, then `npm run preview`: confirm no console output, and that no debug UI shows.
4. **Soak test** (browser, dev server, overlay on): 10 minutes uninterrupted on seeds 1 and 42, plus 5 minutes on a seed of the user's choice. Record: any stuck event, any console warning, frame rate in the start room, and a corridor-heavy area. Test the takeover with keys and, if available, a gamepad; test alt-tab while holding a key; resize the window.
5. **Performance.** Confirm one shadow-casting light, a steady frame rate, and no growth in `renderer.info.memory` after 5 minutes (a temporary check, then removed).
6. **Docs.** Append the Step 5 block to `AI_HANDOFF.md`: the file map (from the contract), what is verified, the tuning constants, known limitations (hero does not attack, Space is recorded only; no doors, keys, or stairs), and decisions made along the way (zoom, lighting values, any clearance change). Add one-line pointers for Step 6: where to add behavior tree branches (`heroBrain.ts` MDSL const), where combat reads hero state (`heroQuery.first`), and that `Space` maps to `inputState.attack`.
7. Update `docs/steps/INDEX.md`: tick 5.00 to 5.14 only after the user approves each result, and tick the Step 5 header.

## Acceptance checklist

- [ ] Step 5 tasks 5.00 to 5.13 are all approved and ticked.
- [ ] The headless test passes for 50 seeds.
- [ ] `npx tsc -b --pretty false`, `npm run lint`, `npm test`, `npm run build`, `node scripts/verify-dungeon.mjs`, `git diff --check` all pass.
- [ ] The hero starts moving on its own with no input, explores all rooms, and resumes 4 seconds after manual input stops.
- [ ] No walking through walls, no snagging in one-tile corridors, no vertical drift.
- [ ] Zero console errors in dev and in the production preview.
- [ ] Per-frame state lives only in the ECS entity or module objects; Zustand is written only on mode flips.
- [ ] Every Step 5 file is under 200 lines; no `any`; no unused dependencies in `package.json`.

## Not in this task

Anything listed in contract section 8. Do not start Step 6.
