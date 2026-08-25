import type { Mission, GameStatus, MissionStats } from '../types';
import { INITIAL_MISSION } from '../data/missions';

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

  /**
   * Updates mission timer and checks for failure.
   */
  update(dt: number, isGameOver: boolean, currentStats?: { maxWakeLevel: number; totalNoiseGenerated: number }): void {
    if (this.gameStatus === 'PLAYING') {
      this.elapsedTime += dt;

      if (isGameOver) {
        this.failMission({
          timeTaken: this.elapsedTime,
          maxWakeLevel: currentStats?.maxWakeLevel ?? 100,
          totalNoiseGenerated: currentStats?.totalNoiseGenerated ?? 0,
        });
      }
    }
  }

  /**
   * Complete the current mission and lock game into GAME_COMPLETE state.
   */
  completeMission(stats: MissionStats): void {
    if (!this.currentMission || this.gameStatus !== 'PLAYING') return;

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
