import type { Room, RenderState, InputState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { BEDROOM }       from '../data/room';
import { Player }        from './Player';
import { drawRoom }      from './renderer/drawRoom';
import { drawFurniture } from './renderer/drawFurniture';
import { drawFriend }    from './renderer/drawFriend';
import { drawPlayer }    from './renderer/drawPlayer';

/**
 * Game — owns the canvas rendering loop and coordinates all sub-systems.
 *
 * Part 3 responsibilities:
 *  - Accept an InputState ref from the React layer (useKeyboard).
 *  - Own a Player instance.
 *  - Run a delta-time game loop.
 *  - Render: room → furniture → friend (Zzz) → player.
 *
 * Future parts will add: noise system, wake meter, friend AI, interactions.
 */
export class Game {
  private ctx:       CanvasRenderingContext2D;
  private room:      Room;
  private player:    Player;
  private inputRef:  { current: InputState };
  private rafId:     number  = 0;
  private running:   boolean = false;
  private lastTime:  number  = 0;

  constructor(
    ctx:      CanvasRenderingContext2D,
    inputRef: { current: InputState },
  ) {
    this.ctx      = ctx;
    this.room     = BEDROOM;
    this.inputRef = inputRef;

    // Spawn near bottom-left — open floor area, away from furniture
    this.player = new Player(100, 420);
  }

  // ── Lifecycle ────────────────────────────────────────────

  start(): void {
    if (this.running) return;
    this.running  = true;
    this.lastTime = performance.now();
    this.rafId    = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  // ── Main loop ────────────────────────────────────────────

  private loop = (timestamp: number): void => {
    if (!this.running) return;

    const dt = (timestamp - this.lastTime) / 1000; // seconds
    this.lastTime = timestamp;

    this.update(dt, timestamp);
    this.render(timestamp);

    this.rafId = requestAnimationFrame(this.loop);
  };

  // ── Update ───────────────────────────────────────────────

  private update(dt: number, _timestamp: number): void {
    this.player.update(dt, this.inputRef.current, this.room);
  }

  // ── Render ───────────────────────────────────────────────

  private render(timestamp: number): void {
    const { ctx, room } = this;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const state: RenderState = { timestamp, player: this.player.state };

    // Draw order: room → furniture → friend → player (on top)
    drawRoom(ctx, room);
    drawFurniture(ctx, room);
    drawFriend(ctx, room, state);
    drawPlayer(ctx, state);
  }
}
