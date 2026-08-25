import { create } from 'zustand';
import type { FriendState, WakeData, Mission, GameStatus, MissionStats, Difficulty, HighScores } from '../types';
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
  difficulty: Difficulty;
  highScores: HighScores;

  // Actions
  setRunning: (running: boolean) => void;
  setGameStatus: (status: GameStatus) => void;
  setWakeData: (data: WakeData) => void;
  setCurrentMission: (mission: Mission | null) => void;
  setHasWaterGlass: (has: boolean) => void;
  setNearbyPrompt: (prompt: string | null) => void;
  setElapsedTime: (time: number) => void;
  setMissionStats: (stats: MissionStats | null) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  recordHighScore: (stats: MissionStats) => void;
  resetGame: () => void;
}

const HIGH_SCORE_KEY = 'dont-wake-my-friend-high-scores';
const defaultScores: HighScores = { bestScore: 0, lowestWakeLevel: 100, fastestCompletion: 0, missionsCompleted: 0 };
function loadHighScores(): HighScores {
  try { return { ...defaultScores, ...JSON.parse(localStorage.getItem(HIGH_SCORE_KEY) ?? '{}') }; }
  catch { return defaultScores; }
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
  difficulty: 'NORMAL',
  highScores: typeof window === 'undefined' ? defaultScores : loadHighScores(),

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
  setDifficulty: (difficulty) => set({ difficulty }),
  recordHighScore: (stats) => set((state) => {
    const highScores: HighScores = {
      bestScore: Math.max(state.highScores.bestScore, stats.stealthScore),
      lowestWakeLevel: Math.min(state.highScores.lowestWakeLevel, stats.maxWakeLevel),
      fastestCompletion: state.highScores.fastestCompletion === 0 ? stats.timeTaken : Math.min(state.highScores.fastestCompletion, stats.timeTaken),
      missionsCompleted: state.highScores.missionsCompleted + 1,
    };
    try { localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScores)); } catch { /* storage is optional */ }
    return { highScores };
  }),

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
