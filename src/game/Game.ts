import type { Room, RenderState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { BEDROOM } from '../data/room';
import { drawRoom }      from './renderer/drawRoom';
import { drawFurniture } from './renderer/drawFurniture';
import { drawFriend }    from './renderer/drawFriend';

/**
 * Game — owns the canvas rendering loop and coordinates all sub-systems.
 *
 * Part 2 responsibilities:
 *  - Hold a reference to the 2D rendering context.
 *  - Run a requestAnimationFrame loop with a timestamp.
 *  - Render the full bedroom using modular renderer functions.
 *  - Animate the sleeping friend's Zzz.
 *
 * Future parts will add: player, input, collision, AI, sound, interactions.
 */
export class Game {
  private ctx:     CanvasRenderingContext2D;
  private room:    Room;
  private rafId:   number  = 0;
  private running: boolean = false;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx  = ctx;
    this.room = BEDROOM;
  }

  // ── Lifecycle ────────────────────────────────────────────

  start(): void {
    if (this.running) return;
    this.running = true;
    this.loop(0);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  // ── Main loop ────────────────────────────────────────────

  private loop = (timestamp: number): void => {
    if (!this.running) return;
    this.update(timestamp);
    this.render(timestamp);
    this.rafId = requestAnimationFrame(this.loop);
  };

  // ── Update (game logic — empty for Part 2) ───────────────

  private update(_timestamp: number): void {
    // Reserved for Part 3+ (player movement, AI, etc.)
  }

  // ── Render ───────────────────────────────────────────────

  private render(timestamp: number): void {
    const { ctx, room } = this;

    // Clear to void
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const state: RenderState = { timestamp };

    // 1. Room structure (walls, floor, window, door)
    drawRoom(ctx, room);

    // 2. Furniture and decorations
    drawFurniture(ctx, room);

    // 3. Sleeping friend (animated)
    drawFriend(ctx, room, state);
  }
}
