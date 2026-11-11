import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearHeroVitals,
  getHeroVitals,
  publishHeroVitals,
  subscribeHeroVitals,
} from './heroVitals';

beforeEach(() => {
  clearHeroVitals();
});

describe('hero vitals store', () => {
  it('starts with no hero', () => {
    expect(getHeroVitals()).toEqual({
      hasHero: false,
      health: 0,
      maxHealth: 0,
    });
  });

  it('publishes the hero values to subscribers', () => {
    let updates = 0;
    const unsubscribe = subscribeHeroVitals(() => {
      updates += 1;
    });

    publishHeroVitals(80, 100);

    expect(getHeroVitals()).toEqual({
      hasHero: true,
      health: 80,
      maxHealth: 100,
    });
    expect(updates).toBe(1);
    unsubscribe();
  });

  it('ignores unchanged values so the HUD does not re-render', () => {
    publishHeroVitals(80, 100);

    let updates = 0;
    const unsubscribe = subscribeHeroVitals(() => {
      updates += 1;
    });
    publishHeroVitals(80, 100);
    publishHeroVitals(79, 100);

    expect(updates).toBe(1);
    expect(getHeroVitals().health).toBe(79);
    unsubscribe();
  });

  it('clears the hero and notifies once', () => {
    publishHeroVitals(80, 100);

    let updates = 0;
    const unsubscribe = subscribeHeroVitals(() => {
      updates += 1;
    });
    clearHeroVitals();
    clearHeroVitals();

    expect(updates).toBe(1);
    expect(getHeroVitals().hasHero).toBe(false);
    unsubscribe();
  });
});
