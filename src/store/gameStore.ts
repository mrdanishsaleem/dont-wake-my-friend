import { create } from 'zustand';
import type { FriendState, WakeData } from '../types';

/**
 * Global game store (Zustand).
 * Tracks running state, wake meter, friend sleep state, statistics, and game over.
 */
interface GameState {
  isRunning: boolean;
  wakeLevel: number;
  friendState: FriendState;
  maxWakeLevel: number;
  totalNoiseGenerated: number;
  currentNoiseRate: number;
  isGameOver: boolean;

  setRunning: (running: boolean) => void;
  setWakeData: (data: WakeData) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  isRunning: false,
  wakeLevel: 0,
  friendState: 'DEEP_SLEEP',
  maxWakeLevel: 0,
  totalNoiseGenerated: 0,
  currentNoiseRate: 0,
  isGameOver: false,

  setRunning: (running) => set({ isRunning: running }),

  setWakeData: (data) =>
    set({
      wakeLevel: data.wakeLevel,
      friendState: data.friendState,
      maxWakeLevel: data.maxWakeLevel,
      totalNoiseGenerated: data.totalNoiseGenerated,
      currentNoiseRate: data.currentNoiseRate,
      isGameOver: data.isGameOver,
    }),

  resetGame: () =>
    set({
      wakeLevel: 0,
      friendState: 'DEEP_SLEEP',
      isGameOver: false,
    }),
}));
