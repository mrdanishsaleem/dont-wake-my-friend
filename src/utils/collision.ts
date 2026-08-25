/**
 * collision.ts — reusable 2D AABB collision utilities.
 *
 * All functions operate on plain Rect objects so they have zero coupling
 * to game-specific types. Player.ts and future systems import from here.
 *
 * API surface:
 *   rectOverlaps(a, b)           — boolean overlap test
 *   overlapDepth(a, b)           — penetration depth on each axis
 *   resolveMovement(pos, vel, obstacles) — separated-axis sweep + push-out
 *   getSolidRects(room)          — extract solid AABBs from room data
 *   clamp(v, lo, hi)             — generic numeric clamp
 */

import type { Rect, Room } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Primitive geometry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if two axis-aligned rectangles overlap.
 * Touching edges (shared border) are NOT considered overlapping.
 */
export function rectOverlaps(a: Rect, b: Rect): boolean {
  return (
    a.x         < b.x + b.w &&
    a.x + a.w   > b.x       &&
    a.y         < b.y + b.h &&
    a.y + a.h   > b.y
  );
}

/**
 * Signed penetration depth on each axis when `a` overlaps `b`.
 * Positive x → a is to the left of b's centre.
 * Positive y → a is above b's centre.
 * Returns { x: 0, y: 0 } when there is no overlap.
 */
export function overlapDepth(a: Rect, b: Rect): { x: number; y: number } {
  if (!rectOverlaps(a, b)) return { x: 0, y: 0 };

  const overlapX =
    a.x < b.x
      ? (a.x + a.w) - b.x         // a is to the left
      : a.x - (b.x + b.w);        // a is to the right (negative)

  const overlapY =
    a.y < b.y
      ? (a.y + a.h) - b.y         // a is above
      : a.y - (b.y + b.h);        // a is below  (negative)

  return { x: overlapX, y: overlapY };
}

// ─────────────────────────────────────────────────────────────────────────────
// Movement resolution
// ─────────────────────────────────────────────────────────────────────────────

export interface MovementInput {
  /** Current position (top-left). Mutated in-place. */
  x: number;
  y: number;
  /** Entity dimensions. */
  w: number;
  h: number;
  /** Velocity in pixels/second. */
  vx: number;
  vy: number;
}

/**
 * resolveMovement — separated-axis sweep collision resolution.
 *
 * Algorithm:
 *  1. Apply X displacement → test all obstacles → push out on X.
 *  2. Apply Y displacement → test all obstacles → push out on Y.
 *
 * Separating the axes means the player can slide along a wall when moving
 * diagonally into it — only the blocked axis is zeroed.
 *
 * @param entity    Mutable position + velocity object (mutated in-place).
 * @param dt        Delta time in seconds.
 * @param obstacles Array of solid AABBs to resolve against.
 */
export function resolveMovement(
  entity: MovementInput,
  dt: number,
  obstacles: readonly Rect[],
): void {
  const entityRect = (): Rect => ({ x: entity.x, y: entity.y, w: entity.w, h: entity.h });

  // ── X axis ────────────────────────────────────────────────────────
  entity.x += entity.vx * dt;
  for (const ob of obstacles) {
    if (rectOverlaps(entityRect(), ob)) {
      if (entity.vx > 0) {
        // Moving right → push left edge to obstacle's left face
        entity.x = ob.x - entity.w;
      } else if (entity.vx < 0) {
        // Moving left  → push right edge to obstacle's right face
        entity.x = ob.x + ob.w;
      } else {
        // No X velocity but somehow inside (e.g. spawned in overlap) — use depth
        const d = overlapDepth(entityRect(), ob);
        entity.x -= d.x;
      }
      entity.vx = 0;
    }
  }

  // ── Y axis ────────────────────────────────────────────────────────
  entity.y += entity.vy * dt;
  for (const ob of obstacles) {
    if (rectOverlaps(entityRect(), ob)) {
      if (entity.vy > 0) {
        entity.y = ob.y - entity.h;
      } else if (entity.vy < 0) {
        entity.y = ob.y + ob.h;
      } else {
        const d = overlapDepth(entityRect(), ob);
        entity.y -= d.y;
      }
      entity.vy = 0;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Room helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getSolidRects — extract all solid bounding boxes from a room.
 *
 * Cached lazily by the caller if needed; this function is pure.
 */
export function getSolidRects(room: Room): Rect[] {
  return room.objects
    .filter((o) => o.solid)
    .map((o) => o.bounds);
}

// ─────────────────────────────────────────────────────────────────────────────
// Misc helpers
// ─────────────────────────────────────────────────────────────────────────────

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
