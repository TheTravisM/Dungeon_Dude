import { create } from 'zustand';
import {
  canTransition,
  nextScreen,
  type ScreenEvent,
  type ScreenState,
} from './screenState';

interface ScreenStore {
  screen: ScreenState;
  /** Applies one approved event; blocked events leave the screen unchanged. */
  send: (event: ScreenEvent) => void;
  /** Returns to the initial Main Menu state without touching game data. */
  reset: () => void;
}

/**
 * Infrequent screen UI state. This lives outside the ECS and outside the
 * existing `GameState` store because screen choice is not aggregate game data
 * and `src/types/index.ts` is protected. Only screen boundaries write here.
 */
export const useScreenStore = create<ScreenStore>()((set) => ({
  screen: 'mainMenu',

  send: (event) =>
    set((state) => {
      if (!canTransition(state.screen, event)) return state;
      return { screen: nextScreen(state.screen, event) };
    }),

  reset: () => set({ screen: 'mainMenu' }),
}));
