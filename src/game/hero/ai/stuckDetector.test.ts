import { describe, expect, it } from 'vitest';
import { createStuckDetector } from './stuckDetector';

const START = { x: 0, z: 0 };
const MOVED = { x: 0.5, z: 0 };

describe('createStuckDetector', () => {
  it('escalates once per quiet window and caps at level 3', () => {
    const detector = createStuckDetector(1000, 0.3);
    detector.reset(0, START);

    expect(detector.sample(500, START, true)).toBe(0);
    expect(detector.sample(1000, START, true)).toBe(1);
    expect(detector.sample(1500, START, true)).toBe(1);
    expect(detector.sample(2000, START, true)).toBe(2);
    expect(detector.sample(3000, START, true)).toBe(3);
    expect(detector.sample(4000, START, true)).toBe(3);
  });

  it('returns 0 while the hero makes progress', () => {
    const detector = createStuckDetector(1000, 0.3);
    detector.reset(0, START);

    expect(detector.sample(1000, MOVED, true)).toBe(0);
    expect(detector.sample(2000, { x: 1, z: 0 }, true)).toBe(0);
  });

  it('never counts a window when the hero does not want to move', () => {
    const detector = createStuckDetector(1000, 0.3);
    detector.reset(0, START);

    expect(detector.sample(1000, START, false)).toBe(0);
    expect(detector.sample(2000, START, false)).toBe(0);
    expect(detector.sample(3000, START, false)).toBe(0);
  });

  it('resets the counter and starts a fresh window', () => {
    const detector = createStuckDetector(1000, 0.3);
    detector.reset(0, START);

    expect(detector.sample(1000, START, true)).toBe(1);
    expect(detector.sample(2000, START, true)).toBe(2);

    detector.reset(2500, START);

    expect(detector.sample(3000, START, true)).toBe(0);
    expect(detector.sample(3500, START, true)).toBe(1);
  });
});
