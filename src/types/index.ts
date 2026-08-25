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
 */
export interface RoomObject {
  id: string;
  kind: RoomObjectKind;
  bounds: Rect;
  solid: boolean;
  interact?: boolean;
  noisy?: boolean;
  meta?: Record<string, unknown>;
}

/** The full room / world description. */
export interface Room {
  width: number;
  height: number;
  objects: RoomObject[];
}

// ─── Player ──────────────────────────────────────────────────────────────────

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  vx: number;
  vy: number;
  facing: Direction;
  moving: boolean;
}

// ─── Input ───────────────────────────────────────────────────────────────────

export interface InputState {
  up:       boolean;
  down:     boolean;
  left:     boolean;
  right:    boolean;
  interact: boolean;
}

// ─── Noise & Wake System Types ───────────────────────────────────────────────

export type NoiseSource = 'walking' | 'running' | 'interaction' | 'environment';

export interface NoiseEvent {
  amount: number;
  position: Vec2;
  timestamp: number;
  source: NoiseSource;
}

export type FriendState =
  | 'DEEP_SLEEP'
  | 'LIGHT_SLEEP'
  | 'RESTLESS'
  | 'ALMOST_AWAKE'
  | 'AWAKE';

export interface WakeData {
  wakeLevel: number; // 0–100
  friendState: FriendState;
  maxWakeLevel: number;
  totalNoiseGenerated: number;
  currentNoiseRate: number;
  isGameOver: boolean;
}

// ─── Interaction System Types ────────────────────────────────────────────────

export interface Interactable {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  promptText: string;
  noiseAmount: number;
  active: boolean;
  meta?: Record<string, unknown>;
}

export interface InteractionEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  text?: string;
}

// ─── Mission System Types ────────────────────────────────────────────────────

export type MissionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type GameStatus = 'PLAYING' | 'GAME_COMPLETE' | 'GAME_OVER';

export interface MissionStats {
  timeTaken: number; // in seconds
  maxWakeLevel: number;
  totalNoiseGenerated: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  target?: string;
  icon?: string;
  stats?: MissionStats;
}

// ─── Animation & Render helpers ──────────────────────────────────────────────

export interface RenderState {
  timestamp: number;
  player: PlayerState;
  wake: WakeData;
  activePrompt?: string | null;
  nearbyInteractable?: Interactable | null;
  interactionEffects?: InteractionEffect[];
  gameStatus?: GameStatus;
  currentMission?: Mission | null;
}

// ─── Canvas resolution ───────────────────────────────────────────────────────

export const CANVAS_WIDTH  = 960;
export const CANVAS_HEIGHT = 540;
