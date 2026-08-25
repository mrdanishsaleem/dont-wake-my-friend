import type { Vec2, Interactable, InteractionEffect } from '../types';

export class InteractionSystem {
  private interactables: Map<string, Interactable> = new Map();
  private nearbyInteractable: Interactable | null = null;
  private effects: InteractionEffect[] = [];

  register(item: Interactable): void {
    this.interactables.set(item.id, item);
  }

  unregister(id: string): void {
    this.interactables.delete(id);
    if (this.nearbyInteractable?.id === id) {
      this.nearbyInteractable = null;
    }
  }

  getInteractable(id: string): Interactable | undefined {
    return this.interactables.get(id);
  }

  setInteractableActive(id: string, active: boolean): void {
    const item = this.interactables.get(id);
    if (item) {
      item.active = active;
      if (!active && this.nearbyInteractable?.id === id) {
        this.nearbyInteractable = null;
      }
    }
  }

  getNearby(): Interactable | null {
    return this.nearbyInteractable;
  }

  getEffects(): InteractionEffect[] {
    return this.effects;
  }

  addEffect(x: number, y: number, timestamp: number, text: string): void {
    this.effects.push({ id: `effect-${timestamp}-${text}`, x, y, startTime: timestamp, duration: 1200, text });
  }

  /**
   * Check proximity of player to active interactables.
   */
  update(_dt: number, playerCenter: Vec2, timestamp: number): void {
    // 1. Clean up expired visual effects
    this.effects = this.effects.filter((e) => timestamp - e.startTime < e.duration);

    // 2. Find closest active interactable within its interaction radius
    let closest: Interactable | null = null;
    let minDistance = Infinity;

    for (const item of this.interactables.values()) {
      if (!item.active) continue;

      const dist = Math.hypot(playerCenter.x - item.x, playerCenter.y - item.y);
      if (dist <= item.radius && dist < minDistance) {
        closest = item;
        minDistance = dist;
      }
    }

    this.nearbyInteractable = closest;
  }

  /**
   * Trigger interaction on the currently active nearby item.
   */
  interact(timestamp: number): { item: Interactable; noise: number } | null {
    if (!this.nearbyInteractable || !this.nearbyInteractable.active) {
      return null;
    }

    const item = this.nearbyInteractable;

    // Create visual effect at item position
    this.effects.push({
      id: `effect-${timestamp}-${item.id}`,
      x: item.x,
      y: item.y,
      startTime: timestamp,
      duration: 1200,
      text: `+${item.noiseAmount} NOISE`,
    });

    return {
      item,
      noise: item.noiseAmount,
    };
  }

  reset(): void {
    this.effects = [];
    this.nearbyInteractable = null;
  }
}
