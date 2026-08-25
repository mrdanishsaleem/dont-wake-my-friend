import type { Mission, GameStatus, MissionStats, StealthRating } from '../types';
import { INITIAL_MISSION } from '../data/missions';

export function calculateStealthRating(
  maxWakeLevel: number,
  timeTaken: number,
  totalNoise: number,
): { score: number; rating: StealthRating } {
  // Score calculation:
  // Baseline 100
  // Wake level penalty: up to 60 pts
  // Excess noise penalty: up to 25 pts (10 is the base item pickup noise)
  // Time factor: gentle penalty if taking longer than 12s
  const wakePenalty = maxWakeLevel * 0.65;
  const excessNoise = Math.max(0, totalNoise - 10);
  const noisePenalty = excessNoise * 0.4;
  const timePenalty = Math.max(0, timeTaken - 12) * 0.5;

  const rawScore = 100 - wakePenalty - noisePenalty - timePenalty;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let rating: StealthRating = 'WALKING DISASTER';
  if (score >= 90) rating = 'NINJA';
  else if (score >= 75) rating = 'PROFESSIONAL SNEAK';
  else if (score >= 50) rating = 'DECENT';

  return { score, rating };
}

export class MissionSystem {
  private currentMission: Mission | null = null;
  private gameStatus: GameStatus = 'PLAYING';
  private elapsedTime: number = 0; // seconds

  constructor(initialMission: Mission = INITIAL_MISSION) {
    this.startMission(initialMission);
  }

  startMission(mission: Mission): void {
    this.currentMission = {
      ...mission,
      status: 'IN_PROGRESS',
    };
    this.gameStatus = 'PLAYING';
    this.elapsedTime = 0;
  }

  pause(): void {
    if (this.gameStatus === 'PLAYING') {
      this.gameStatus = 'PAUSED';
    }
  }

  resume(): void {
    if (this.gameStatus === 'PAUSED') {
      this.gameStatus = 'PLAYING';
    }
  }

  togglePause(): void {
    if (this.gameStatus === 'PLAYING') {
      this.pause();
    } else if (this.gameStatus === 'PAUSED') {
      this.resume();
    }
  }

  /**
   * Updates mission timer when active and not paused.
   */
  update(
    dt: number,
    isGameOver: boolean,
    currentStats?: { maxWakeLevel: number; totalNoiseGenerated: number },
  ): void {
    if (this.gameStatus === 'PLAYING') {
      this.elapsedTime += dt;

      if (isGameOver) {
        const { score, rating } = calculateStealthRating(
          100,
          this.elapsedTime,
          currentStats?.totalNoiseGenerated ?? 0,
        );

        this.failMission({
          timeTaken: this.elapsedTime,
          maxWakeLevel: 100,
          totalNoiseGenerated: currentStats?.totalNoiseGenerated ?? 0,
          stealthScore: score,
          stealthRating: rating,
        });
      }
    }
  }

  /**
   * Complete the current mission and lock game into GAME_COMPLETE state.
   */
  completeMission(rawStats: { timeTaken: number; maxWakeLevel: number; totalNoiseGenerated: number }): void {
    if (!this.currentMission || this.gameStatus !== 'PLAYING') return;

    const { score, rating } = calculateStealthRating(
      rawStats.maxWakeLevel,
      rawStats.timeTaken,
      rawStats.totalNoiseGenerated,
    );

    const stats: MissionStats = {
      ...rawStats,
      stealthScore: score,
      stealthRating: rating,
    };

    this.currentMission = {
      ...this.currentMission,
      status: 'COMPLETED',
      stats,
    };
    this.gameStatus = 'GAME_COMPLETE';
  }

  /**
   * Fail the mission (woke friend).
   */
  failMission(stats: MissionStats): void {
    if (!this.currentMission) return;

    this.currentMission = {
      ...this.currentMission,
      status: 'FAILED',
      stats,
    };
    this.gameStatus = 'GAME_OVER';
  }

  getCurrentMission(): Mission | null {
    return this.currentMission;
  }

  getGameStatus(): GameStatus {
    return this.gameStatus;
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  reset(): void {
    this.startMission(INITIAL_MISSION);
  }
}
