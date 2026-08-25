import type { InputState, PlayerState, Room } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { resolveMovement, getSolidRects, clamp } from '../utils/collision';

/** How many pixels per second the player moves. */
const BASE_SPEED = 140;

/** 1 / √2 for normalising diagonal velocity. */
const INV_SQRT2 = 1 / Math.sqrt(2);

/**
 * Player — owns movement state and delegates collision resolution to collision utils.
 *
 * The public `state` object is read by the renderer each frame.
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

    // ── Move & resolve collision against room solid obstacles ─────────
    const solidObstacles = getSolidRects(room);
    resolveMovement(state, safeDt, solidObstacles);

    // ── Hard canvas boundary clamp (safety net) ───────────────────────
    state.x = clamp(state.x, 0, CANVAS_WIDTH  - state.w);
    state.y = clamp(state.y, 0, CANVAS_HEIGHT - state.h);
  }
}
