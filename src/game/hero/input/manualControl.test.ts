import { describe, expect, it } from 'vitest';
import { createManualClock } from './manualControl';

describe('createManualClock', () => {
  it('starts in auto mode before any input', () => {
    const clock = createManualClock();

    expect(clock.isManual(0)).toBe(false);
    expect(clock.lastActiveAt()).toBe(-Infinity);
  });

  it('is manual immediately after input', () => {
    const clock = createManualClock();
    clock.registerInput(1000);

    expect(clock.isManual(1000)).toBe(true);
  });

  it('is still manual at 3999 ms', () => {
    const clock = createManualClock();
    clock.registerInput(0);

    expect(clock.isManual(3999)).toBe(true);
  });

  it('returns to auto at exactly 4000 ms', () => {
    const clock = createManualClock();
    clock.registerInput(0);

    expect(clock.isManual(4000)).toBe(false);
  });

  it('extends the window on repeated input', () => {
    const clock = createManualClock();
    clock.registerInput(1000);
    clock.registerInput(3000);

    expect(clock.isManual(6999)).toBe(true);
    expect(clock.isManual(7000)).toBe(false);
  });
});
