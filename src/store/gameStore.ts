import { create } from 'zustand';
import type { FriendState, WakeData } from '../types';

/**
 * Global game store (Zustand).
 * Tracks running state, wake meter, friend sleep state, statistics, objective, and interactions.
 */
interface GameState {
  isRunning: boolean;
  wakeLevel: number;
  friendState: FriendState;
  maxWakeLevel: number;
  totalNoiseGenerated: number;
  currentNoiseRate: number;
  isGameOver: boolean;

  // Objective & inventory
  objective: string;
  hasWaterGlass: boolean;
  nearbyPrompt: string | null;

  setRunning: (running: boolean) => void;
  setWakeData: (data: WakeData) => void;
  setObjective: (text: string) => void;
  setHasWaterGlass: (has: boolean) => void;
  setNearbyPrompt: (prompt: string | null) => void;
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

  objective: 'Get a glass of water.',
  hasWaterGlass: false,
  nearbyPrompt: null,

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

  setObjective: (text) => set({ objective: text }),
  setHasWaterGlass: (has) => set({ hasWaterGlass: has }),
  setNearbyPrompt: (prompt) => set({ nearbyPrompt: prompt }),

  resetGame: () =>
    set({
      wakeLevel: 0,
      friendState: 'DEEP_SLEEP',
      isGameOver: false,
      objective: 'Get a glass of water.',
      hasWaterGlass: false,
      nearbyPrompt: null,
    }),
}));
