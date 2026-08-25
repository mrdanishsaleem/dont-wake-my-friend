// ─── Shared game types ────────────────────────────────────────────────────────

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Axis-aligned bounding box used for collision and rendering. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ─── Room object kinds ───────────────────────────────────────────────────────

export type RoomObjectKind =
  | 'wall'
  | 'floor'
  | 'door'
  | 'window'
  | 'bed'
  | 'desk'
  | 'chair'
  | 'nightstand'
  | 'bookshelf'
  | 'rug'
  | 'decor';

/**
 * A static entity in the room.
 * - `bounds`   — axis-aligned bounding box (used for collision & rendering)
 * - `solid`    — blocks player movement
 * - `interact` — player can interact (future)
 * - `noisy`    — interacting generates noise (future)
 */
export interface RoomObject {
  id: string;
  kind: RoomObjectKind;
  bounds: Rect;
  solid: boolean;
  interact?: boolean;
  noisy?: boolean;
  /** Arbitrary extra data a renderer may need. */
  meta?: Record<string, unknown>;
}

/** The full room / world description. */
export interface Room {
  /** Logical canvas dimensions the room was designed for. */
  width: number;
  height: number;
  objects: RoomObject[];
}

// ─── Player ──────────────────────────────────────────────────────────────────

/** Cardinal + diagonal directions the player can face / move. */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Mutable movement state owned by the Player class. */
export interface PlayerState {
  x: number;
  y: number;
  /** Collision box dimensions. */
  w: number;
  h: number;
  /** Pixels per second. */
  speed: number;
  /** Current velocity this frame (pixels/sec). Normalised for diagonals. */
  vx: number;
  vy: number;
  /** Last direction the player was moving — used for sprite orientation. */
  facing: Direction;
  /** True when any movement key is held. */
  moving: boolean;
}

// ─── Input ───────────────────────────────────────────────────────────────────

/**
 * Snapshot of which movement actions are currently active.
 * Decoupled from raw key codes so remapping is trivial later.
 */
export interface InputState {
  up:    boolean;
  down:  boolean;
  left:  boolean;
  right: boolean;
}

// ─── Animation helpers ───────────────────────────────────────────────────────

/** State threaded through every render call so sub-renderers can animate. */
export interface RenderState {
  /** Monotonically increasing timestamp from requestAnimationFrame (ms). */
  timestamp: number;
  /** The player's current state (position, facing, moving flag). */
  player: PlayerState;
}

// ─── Canvas resolution ───────────────────────────────────────────────────────

/** The internal (logical) resolution of the canvas. */
export const CANVAS_WIDTH  = 960;
export const CANVAS_HEIGHT = 540;
