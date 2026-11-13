import { describe, expect, it } from 'vitest';
import { createVoiceLimiter, type VoiceRule } from './voiceLimiter';

const single: VoiceRule = { maxVoices: 1, minIntervalMs: 0 };

describe('voice limiter', () => {
  it('honors maxVoices and frees a slot on release', () => {
    const limiter = createVoiceLimiter();

    expect(limiter.tryAcquire('hit', 0, single)).toBe(true);
    expect(limiter.tryAcquire('hit', 100, single)).toBe(false);

    limiter.release('hit');
    expect(limiter.tryAcquire('hit', 200, single)).toBe(true);
  });

  it('honors the minimum interval between accepted starts', () => {
    const limiter = createVoiceLimiter();
    const rule: VoiceRule = { maxVoices: 3, minIntervalMs: 100 };

    expect(limiter.tryAcquire('hit', 1000, rule)).toBe(true);
    expect(limiter.tryAcquire('hit', 1050, rule)).toBe(false);
    expect(limiter.tryAcquire('hit', 1100, rule)).toBe(true);
  });

  it('never drops below zero active voices', () => {
    const limiter = createVoiceLimiter();

    limiter.release('missing');
    limiter.release('hit');
    limiter.release('hit');

    expect(limiter.tryAcquire('hit', 0, single)).toBe(true);
  });

  it('keeps ids independent', () => {
    const limiter = createVoiceLimiter();

    expect(limiter.tryAcquire('a', 0, single)).toBe(true);
    expect(limiter.tryAcquire('b', 0, single)).toBe(true);
    expect(limiter.tryAcquire('a', 10, single)).toBe(false);
  });

  it('clears every id on reset', () => {
    const limiter = createVoiceLimiter();
    limiter.tryAcquire('hit', 0, single);
    limiter.reset();

    expect(limiter.tryAcquire('hit', 0, single)).toBe(true);
  });

  it('refuses sounds with no allowed voices', () => {
    const limiter = createVoiceLimiter();

    expect(
      limiter.tryAcquire('hit', 0, { maxVoices: 0, minIntervalMs: 0 })
    ).toBe(false);
  });
});
