import type { FriendState, WakeData } from '../types';

export interface WakeSystemConfig {
  maxWakeLevel: number;
}

/**
 * WakeSystem — manages the friend's wake meter and current sleep state.
 */
export class WakeSystem {
  private wakeLevel: number = 0;
  private maxWakeLevelReached: number = 0;
  private isGameOver: boolean = false;

  constructor(initialWakeLevel: number = 0) {
    this.wakeLevel = initialWakeLevel;
    this.maxWakeLevelReached = initialWakeLevel;
  }

  /**
   * Apply change in wake level (positive from noise, negative from decay).
   */
  update(wakeDelta: number): void {
    if (this.isGameOver) return; // Freeze when game over until reset

    this.wakeLevel = Math.max(0, Math.min(100, this.wakeLevel + wakeDelta));

    if (this.wakeLevel > this.maxWakeLevelReached) {
      this.maxWakeLevelReached = this.wakeLevel;
    }

    if (this.wakeLevel >= 100) {
      this.wakeLevel = 100;
      this.isGameOver = true;
    }
  }

  getWakeLevel(): number {
    return this.wakeLevel;
  }

  getFriendState(): FriendState {
    if (this.wakeLevel >= 100) return 'AWAKE';
    if (this.wakeLevel >= 85)  return 'ALMOST_AWAKE';
    if (this.wakeLevel >= 70)  return 'RESTLESS';
    return 'DEEP_SLEEP';
  }

  getIsGameOver(): boolean {
    return this.isGameOver;
  }

  getData(currentNoiseRate: number = 0, totalNoiseGenerated: number = 0): WakeData {
    return {
      wakeLevel: this.wakeLevel,
      friendState: this.getFriendState(),
      maxWakeLevel: this.maxWakeLevelReached,
      totalNoiseGenerated,
      currentNoiseRate,
      isGameOver: this.isGameOver,
    };
  }

  reset(): void {
    this.wakeLevel = 0;
    this.maxWakeLevelReached = 0;
    this.isGameOver = false;
  }
}
