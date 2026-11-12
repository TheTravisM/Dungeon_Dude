import { describe, expect, it } from 'vitest';
import { screenAnnouncement } from './screenAnnouncement';

const run = { depth: 3, gold: 12, monstersSlain: 4 };

describe('screenAnnouncement', () => {
  it('stays silent on the initial render', () => {
    expect(screenAnnouncement(null, 'mainMenu', run)).toBe('');
  });

  it('stays silent when the screen did not change', () => {
    expect(screenAnnouncement('playing', 'playing', run)).toBe('');
    expect(screenAnnouncement('gameOver', 'gameOver', run)).toBe('');
  });

  it('announces a first game start with the depth', () => {
    expect(screenAnnouncement('mainMenu', 'playing', run)).toBe(
      'Game started at depth 3.'
    );
  });

  it('distinguishes a restart from a first start', () => {
    expect(screenAnnouncement('gameOver', 'playing', run)).toBe(
      'New run started at depth 3.'
    );
  });

  it('summarises the run on game over', () => {
    expect(screenAnnouncement('playing', 'gameOver', run)).toBe(
      'Game over at depth 3. 12 gold collected. 4 monsters slain.'
    );
  });

  it('announces the main menu return', () => {
    expect(screenAnnouncement('gameOver', 'mainMenu', run)).toBe('Main menu.');
  });
});
