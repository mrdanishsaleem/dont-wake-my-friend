import type { InputState, PlayerState, Room, Rect } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

/** How many pixels per second the player moves. */
const BASE_SPEED = 140;

/** 1 / √2 for normalising diagonal velocity. */
const INV_SQRT2 = 1 / Math.sqrt(2);

/**
 * Player — owns movement state and collision resolution.
 *
 * The public `state` object is read by the renderer each frame — it is
 * intentionally a plain object so renderers don't need to import the class.
 *
 * Part 3 scope:
 *  - WASD + Arrow key movement
 *  - Frame-rate independent (delta-time)
 *  - Normalised diagonal movement
 *  - Wall + solid-furniture AABB collision
 *
 * Future parts will add: noise generation, interaction range, wake effects.
 */
export class Player {
  /** Public readable state — mutated in-place every frame. */
  readonly state: PlayerState;

  constructor(spawnX: number, spawnY: number) {
    this.state = {
      x:      spawnX,
      y:      spawnY,
      w:      20,
      h:      20,
      speed:  BASE_SPEED,
      vx:     0,
      vy:     0,
      facing: 'down',
      moving: false,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────

  /**
   * update — called once per frame before rendering.
   *
   * @param dt      Delta time in seconds (capped to avoid spiral-of-death).
   * @param input   Current keyboard snapshot from useKeyboard.
   * @param room    Room data used for collision.
   */
  update(dt: number, input: InputState, room: Room): void {
    // Cap dt so a tab-switch pause doesn't teleport the player
    const safeDt = Math.min(dt, 0.1);

    const { state } = this;

    // ── Raw direction from input ──────────────────────────────────────
    let dx = 0;
    let dy = 0;

    if (input.left)  dx -= 1;
    if (input.right) dx += 1;
    if (input.up)    dy -= 1;
    if (input.down)  dy += 1;

    state.moving = dx !== 0 || dy !== 0;

    // ── Normalise diagonal movement ───────────────────────────────────
    if (dx !== 0 && dy !== 0) {
      dx *= INV_SQRT2;
      dy *= INV_SQRT2;
    }

    // ── Compute velocity ──────────────────────────────────────────────
    state.vx = dx * state.speed;
    state.vy = dy * state.speed;

    // ── Update facing direction ───────────────────────────────────────
    // Prefer cardinal directions; last pressed wins for diagonals.
    if      (dy < 0) state.facing = 'up';
    else if (dy > 0) state.facing = 'down';
    else if (dx < 0) state.facing = 'left';
    else if (dx > 0) state.facing = 'right';

    // ── Move & resolve collision (separated axes) ─────────────────────
    this.moveAndCollide(safeDt, room);
  }

  // ─────────────────────────────────────────────────────────────────────────

  private moveAndCollide(dt: number, room: Room): void {
    const { state } = this;
    const solidBounds = getSolidBounds(room);

    // ── X axis ───────────────────────────────────────────────────────
    state.x += state.vx * dt;
    for (const ob of solidBounds) {
      if (overlaps(state, ob)) {
        if (state.vx > 0) state.x = ob.x - state.w;
        else               state.x = ob.x + ob.w;
        state.vx = 0;
      }
    }

    // ── Y axis ───────────────────────────────────────────────────────
    state.y += state.vy * dt;
    for (const ob of solidBounds) {
      if (overlaps(state, ob)) {
        if (state.vy > 0) state.y = ob.y - state.h;
        else               state.y = ob.y + ob.h;
        state.vy = 0;
      }
    }

    // ── Hard canvas boundary clamp (safety net) ───────────────────────
    state.x = clamp(state.x, 0, CANVAS_WIDTH  - state.w);
    state.y = clamp(state.y, 0, CANVAS_HEIGHT - state.h);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract solid AABBs from room objects (walls + solid furniture). */
function getSolidBounds(room: Room): Rect[] {
  return room.objects
    .filter((o) => o.solid)
    .map((o) => o.bounds);
}

/** AABB overlap test between the player rect and an obstacle rect. */
function overlaps(p: PlayerState, r: Rect): boolean {
  return (
    p.x          < r.x + r.w &&
    p.x + p.w    > r.x       &&
    p.y          < r.y + r.h &&
    p.y + p.h    > r.y
  );
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
