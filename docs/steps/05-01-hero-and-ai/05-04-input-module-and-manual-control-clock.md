# 05-04 Input module and manual-control clock

**Type:** LOGIC (tested) + small DEBUG UI
**Depends on:** 05-03 approved. (Logic only; could run earlier, but keep the order.)
**Rules:** `docs/steps/INDEX.md`. Read `STEP-5-CONTRACT.md` sections 1, 2, 3, and 4 only.

## Goal

A framework-free input layer: keyboard (WASD, arrows, Space), gamepad, and the 4 second manual-control rule. Pure modules are unit tested. Nothing moves the hero yet.

## Inspect first

`src/game/store.ts` (`autoPlaying`, `lastInputTime`, `setAutoPlaying`, `updateLastInputTime`), `src/game/hero/constants.ts`.

## Create (all under `src/game/hero/`, each with a `*.test.ts`)

1. `isoMovement.ts`
   ```ts
   export interface Axes { x: number; y: number }          // x: right +, y: forward (screen up) +
   export function axesToWorldDirection(axes: Axes): { x: number; z: number } // unit length or zero
   ```
   Screen up = `(-0.7071, -0.7071)` in `(x, z)`, screen right = `(+0.7071, -0.7071)`. Direction = `right * axes.x + up * axes.y`, normalized, zero stays zero. Tests: W gives `(-s, -s)`, D gives `(+s, -s)`, W+D gives `(0, -1)` (straight along `-z`), opposing axes cancel to zero, output length is 1 for any nonzero input.
2. `input/keyTracker.ts`: pure tracker of held key codes.
   ```ts
   export interface KeyTracker {
     keyDown(code: string): void;
     keyUp(code: string): void;
     clear(): void;
     axes(): Axes;           // KeyW/ArrowUp = y+1, KeyS/ArrowDown = y-1, KeyD/ArrowRight = x+1, KeyA/ArrowLeft = x-1
     attackHeld(): boolean;  // Space
     anyHeld(): boolean;     // any mapped key
   }
   export function createKeyTracker(): KeyTracker;
   ```
   Use `KeyboardEvent.code`, never `key`. Tests: opposing keys cancel, `clear()` zeroes everything, unmapped codes are ignored, releasing one of two keys keeps the other.
3. `input/gamepad.ts`: pure reader.
   ```ts
   export interface PadReading { axes: Axes; attack: boolean; active: boolean }
   export function readGamepad(pad: { axes: readonly number[]; buttons: readonly { pressed: boolean }[] } | null): PadReading
   ```
   Left stick axes 0 (x) and 1 (y, inverted so up is +1). Apply `GAMEPAD_DEADZONE` radially. D-pad buttons 12 to 15 (up, down, left, right) override the stick. Attack is button 0 or 2. `active` is true when any axis or attack is nonzero. Tests: inside deadzone is inactive, full push up gives `y = 1`, d-pad overrides stick, null pad is inactive.
4. `input/manualControl.ts`: the idle clock.
   ```ts
   export interface ManualClock {
     registerInput(nowMs: number): void;
     isManual(nowMs: number): boolean;   // nowMs - lastActiveAt < HERO_IDLE_RETURN_MS
     lastActiveAt(): number;
   }
   export function createManualClock(idleMs?: number): ManualClock;
   ```
   Starts with `lastActiveAt = -Infinity` so the hero begins in auto mode. Tests: auto before any input, manual immediately after input, still manual at 3999 ms, auto at 4000 ms, repeated input extends the window.
5. `input/inputState.ts`: the module singleton, no React.
   ```ts
   export const inputState: {
     axes: Axes; attack: boolean; manualActive: boolean;
   };
   export function pollInput(nowMs: number): void;       // reads tracker + gamepad, updates inputState, registers activity
   export function isManualNow(nowMs: number): boolean;
   export function installInputListeners(): () => void;  // returns cleanup
   ```
   Listeners: `keydown`, `keyup` on `window`; `blur` on `window` and `visibilitychange` (when hidden) both call `tracker.clear()`. In `keydown`, call `preventDefault()` for mapped codes only, and skip entirely when `event.target` is an input, textarea, select, or contentEditable element, or when `event.ctrlKey`, `metaKey`, or `altKey` is held. Ignore `event.repeat` for the tracker but still register activity. `pollInput` reads `navigator.getGamepads()` index by index, takes the first non-null pad, and guards against the API being absent.
   Rules: hold-or-input rule is "any held key or active pad registers activity every poll". Call `updateLastInputTime()` from the store and `setAutoPlaying(false)` ONLY when the mode flips from auto to manual. When `isManual` turns false, call `setAutoPlaying(true)` once. Never write the store per frame. StrictMode safe: the cleanup removes the exact listeners it added.
6. `src/components/debug/HeroDebugReadout.tsx`: dev-only small overlay (render only when `import.meta.env.DEV`), updated with `useFrame` writing `textContent` of a ref'd element, showing: mode (AUTO or MANUAL), axes, attack, and `manual window ms left`. Mount it from the existing debug overlay or `App.tsx` guarded by DEV. Keep it out of production builds.
7. Mount: a tiny `src/components/hero/InputBridge.tsx` using `useEffect(() => installInputListeners(), [])` and a `useFrame` calling `pollInput(performance.now())`. Mount it once in `App.tsx` inside the Canvas next to `<Hero />`.

## Acceptance

- [ ] `npm test` passes all new tests (at least 20 assertions across the four test files).
- [ ] The debug readout shows MANUAL while WASD, arrows, or a gamepad are active and returns to AUTO exactly 4 seconds after the last input.
- [ ] Alt-tab while holding a key does not leave the hero stuck in MANUAL.
- [ ] Typing in a future text field would not trigger the hero (target guard in place and tested by code review).
- [ ] The store is not written per frame (add a temporary counter on `setAutoPlaying` calls if unsure; remove it).
- [ ] The page does not scroll or jump on arrow keys or Space.

## Verify

INDEX commands including `npm test`, then browser: press keys, watch the readout, wait 4 seconds, switch tabs while holding a key, plug in a pad if available.

## Not in this task

Moving the hero. Attack behavior (Space is only recorded).
