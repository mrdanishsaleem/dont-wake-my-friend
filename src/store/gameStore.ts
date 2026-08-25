import { create } from 'zustand';

/**
 * Global game store (Zustand).
 *
 * Part 1 only tracks whether the game is running.
 * Future parts will add player state, wake meter, mission status, etc.
 */
interface GameState {
  isRunning: boolean;
  setRunning: (running: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  isRunning: false,
  setRunning: (running) => set({ isRunning: running }),
}));
