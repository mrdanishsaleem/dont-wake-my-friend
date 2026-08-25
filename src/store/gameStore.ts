import { create } from 'zustand';
import type { FriendState, WakeData, Mission, GameStatus, MissionStats } from '../types';
import { INITIAL_MISSION } from '../data/missions';

/**
 * Global game store (Zustand).
 * Tracks running state, wake meter, friend sleep state, statistics, missions, and game status.
 */
interface GameState {
  isRunning: boolean;
  gameStatus: GameStatus;

  // Wake & Stealth
  wakeLevel: number;
  friendState: FriendState;
  maxWakeLevel: number;
  totalNoiseGenerated: number;
  currentNoiseRate: number;
  isGameOver: boolean;

  // Mission & Interaction
  currentMission: Mission | null;
  hasWaterGlass: boolean;
  nearbyPrompt: string | null;
  elapsedTime: number;
  missionStats: MissionStats | null;

  // Actions
  setRunning: (running: boolean) => void;
  setGameStatus: (status: GameStatus) => void;
  setWakeData: (data: WakeData) => void;
  setCurrentMission: (mission: Mission | null) => void;
  setHasWaterGlass: (has: boolean) => void;
  setNearbyPrompt: (prompt: string | null) => void;
  setElapsedTime: (time: number) => void;
  setMissionStats: (stats: MissionStats | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  isRunning: false,
  gameStatus: 'PLAYING',

  wakeLevel: 0,
  friendState: 'DEEP_SLEEP',
  maxWakeLevel: 0,
  totalNoiseGenerated: 0,
  currentNoiseRate: 0,
  isGameOver: false,

  currentMission: INITIAL_MISSION,
  hasWaterGlass: false,
  nearbyPrompt: null,
  elapsedTime: 0,
  missionStats: null,

  setRunning: (running) => set({ isRunning: running }),
  setGameStatus: (status) => set({ gameStatus: status }),

  setWakeData: (data) =>
    set({
      wakeLevel: data.wakeLevel,
      friendState: data.friendState,
      maxWakeLevel: data.maxWakeLevel,
      totalNoiseGenerated: data.totalNoiseGenerated,
      currentNoiseRate: data.currentNoiseRate,
      isGameOver: data.isGameOver,
    }),

  setCurrentMission: (mission) => set({ currentMission: mission }),
  setHasWaterGlass: (has) => set({ hasWaterGlass: has }),
  setNearbyPrompt: (prompt) => set({ nearbyPrompt: prompt }),
  setElapsedTime: (time) => set({ elapsedTime: time }),
  setMissionStats: (stats) => set({ missionStats: stats }),

  resetGame: () =>
    set({
      gameStatus: 'PLAYING',
      wakeLevel: 0,
      friendState: 'DEEP_SLEEP',
      maxWakeLevel: 0,
      totalNoiseGenerated: 0,
      currentNoiseRate: 0,
      isGameOver: false,
      currentMission: { ...INITIAL_MISSION, status: 'IN_PROGRESS' },
      hasWaterGlass: false,
      nearbyPrompt: null,
      elapsedTime: 0,
      missionStats: null,
    }),
}));
