import type { ScreenState } from './screenState';

export interface RunSummary {
  depth: number;
  gold: number;
  monstersSlain: number;
}

/**
 * Screen-reader message for a screen change. Returns an empty string when the
 * screen did not change, so run-value updates never produce an announcement.
 */
export function screenAnnouncement(
  previous: ScreenState | null,
  next: ScreenState,
  run: RunSummary
): string {
  if (previous === next) return '';
  if (previous === null) return '';

  switch (next) {
    case 'playing':
      return previous === 'gameOver'
        ? `New run started at depth ${run.depth}.`
        : `Game started at depth ${run.depth}.`;
    case 'gameOver':
      return `Game over at depth ${run.depth}. ${run.gold} gold collected. ${run.monstersSlain} monsters slain.`;
    case 'mainMenu':
      return 'Main menu.';
  }
}
