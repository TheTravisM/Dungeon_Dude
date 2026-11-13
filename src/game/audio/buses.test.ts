import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MIXER,
  busGain,
  clamp01,
  soundGain,
  type MixerState,
} from './buses';

function mixer(overrides: Partial<MixerState> = {}): MixerState {
  return {
    volumes: { ...DEFAULT_MIXER.volumes, ...overrides.volumes },
    muted: overrides.muted ?? false,
  };
}

describe('clamp01', () => {
  it('treats non-finite values as silence', () => {
    expect(clamp01(Number.NaN)).toBe(0);
    expect(clamp01(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clamp01(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('clamps to the unit range', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(2)).toBe(1);
  });
});

describe('busGain', () => {
  it('is silent while muted', () => {
    expect(busGain(mixer({ muted: true }), 'sfx')).toBe(0);
  });

  it('multiplies master by the bus trim', () => {
    expect(busGain(mixer(), 'sfx')).toBeCloseTo(0.8);
    expect(busGain(mixer(), 'ambient')).toBeCloseTo(0.4);
    expect(busGain(mixer(), 'ui')).toBeCloseTo(0.64);
  });
});

describe('soundGain', () => {
  it('applies the per-sound trim on top of the bus', () => {
    expect(soundGain(mixer(), 'sfx', 0.5)).toBeCloseTo(0.4);
    expect(soundGain(mixer(), 'sfx', 2)).toBeCloseTo(0.8);
    expect(soundGain(mixer({ muted: true }), 'sfx', 1)).toBe(0);
  });
});
