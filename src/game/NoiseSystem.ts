import type { Vec2, NoiseSource, NoiseEvent, PlayerState } from '../types';

export interface NoiseConfig {
  /** Wake points added per second while walking (base rate). */
  walkNoiseRate: number;
  /** Wake points added per second while running (future sprint/fast move). */
  runNoiseRate: number;
  /** Wake points deducted per second when player is silent/idle. */
  decayRate: number;
  /** Distance thresholds for attenuation (in pixels). */
  distanceTiers: {
    veryClose: number;  // < 140px -> 200%
    close: number;      // < 260px -> 100%
    medium: number;     // < 420px -> 50%
  };
}

export const DEFAULT_NOISE_CONFIG: NoiseConfig = {
  walkNoiseRate: 0.5,
  runNoiseRate: 1.5,
  decayRate: 2.0,
  distanceTiers: {
    veryClose: 140,
    close: 260,
    medium: 420,
  },
};

/**
 * NoiseSystem — tracks noise generation, distance attenuation, and noise events.
 */
export class NoiseSystem {
  private config: NoiseConfig;
  private friendPos: Vec2;

  private currentNoiseRate: number = 0; // noise rate generated this frame (points/sec)
  private totalNoiseGenerated: number = 0;
  private recentEvents: NoiseEvent[] = [];

  constructor(friendPos: Vec2, config: NoiseConfig = DEFAULT_NOISE_CONFIG) {
    this.friendPos = friendPos;
    this.config = config;
  }

  setDifficulty(multiplier: number, recoveryMultiplier: number): void {
    this.config = { ...DEFAULT_NOISE_CONFIG, walkNoiseRate: DEFAULT_NOISE_CONFIG.walkNoiseRate * multiplier, decayRate: DEFAULT_NOISE_CONFIG.decayRate * recoveryMultiplier };
  }

  setFriendPosition(pos: Vec2): void {
    this.friendPos = pos;
  }

  /**
   * Calculate distance multiplier based on player's position relative to the friend.
   */
  getDistanceMultiplier(pos: Vec2): number {
    const dx = pos.x - this.friendPos.x;
    const dy = pos.y - this.friendPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.config.distanceTiers.veryClose) return 2.0;  // 200% Very close
    if (dist < this.config.distanceTiers.close)     return 1.0;  // 100% Close
    if (dist < this.config.distanceTiers.medium)    return 0.5;  // 50% Medium
    return 0.25;                                                // 25% Far away
  }

  /**
   * Record a discrete or continuous noise event.
   */
  emitNoise(amount: number, pos: Vec2, source: NoiseSource, timestamp: number): void {
    this.recentEvents.push({ amount, position: pos, timestamp, source });
    this.totalNoiseGenerated += amount;
  }

  /**
   * Update noise system for the current frame.
   * Returns the effective wake delta (positive if increasing, negative if decaying).
   */
  update(dt: number, player: PlayerState, timestamp: number): number {
    // 1. Clean up old events (> 4 seconds)
    const cutoff = timestamp - 4000;
    this.recentEvents = this.recentEvents.filter((e) => e.timestamp >= cutoff);

    // 2. Continuous noise generation from player movement
    let baseNoiseRate = 0;
    if (player.moving) {
      // Normal walk noise (or higher if fast)
      baseNoiseRate = this.config.walkNoiseRate;
      this.totalNoiseGenerated += baseNoiseRate * dt;
    }

    this.currentNoiseRate = baseNoiseRate;

    // 3. Apply distance attenuation
    const playerCenter: Vec2 = {
      x: player.x + player.w / 2,
      y: player.y + player.h / 2,
    };
    const distanceMult = this.getDistanceMultiplier(playerCenter);
    const effectiveNoiseRate = baseNoiseRate * distanceMult;

    // 4. Calculate effective delta for wake system
    if (player.moving && effectiveNoiseRate > 0) {
      return effectiveNoiseRate * dt;
    } else {
      // Decay when player is quiet
      return -this.config.decayRate * dt;
    }
  }

  getCurrentNoiseRate(): number {
    return this.currentNoiseRate;
  }

  getTotalNoiseGenerated(): number {
    return this.totalNoiseGenerated;
  }

  getRecentEvents(): readonly NoiseEvent[] {
    return this.recentEvents;
  }

  reset(): void {
    this.currentNoiseRate = 0;
    this.totalNoiseGenerated = 0;
    this.recentEvents = [];
  }
}
