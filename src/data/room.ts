import type { Room } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

const W = CANVAS_WIDTH;   // 960
const H = CANVAS_HEIGHT;  // 540

/**
 * BEDROOM — the single room in Part 1.
 *
 * Coordinate system: top-down, origin (0,0) top-left.
 *
 * Layout sketch (not to scale):
 *
 *  ┌────────────[window]──────────────────────────────────────┐  ← top wall (y=0)
 *  │                                                    [bed] │
 *  [door]              [rug]                          [night] │
 *  │                                                          │
 *  │         [desk+chair]                                     │
 *  └──────────────────────────────────────────────────────────┘  ← bottom wall (y=H)
 *
 * The bed occupies the top-right quadrant so the window moonbeam
 * falls naturally over the friend.
 *
 * Open floor area is left-center, giving the player room to move.
 */
export const BEDROOM: Room = {
  width:  W,
  height: H,
  name: 'Bedroom',
  floorType: 'carpet',
  objects: [

    // ── Walls (used for collision boundary) ───────────────────────────
    {
      id: 'wall-top',
      kind: 'wall',
      bounds: { x: 0,     y: 0,      w: W,  h: 30 },
      solid: true,
    },
    {
      id: 'wall-bottom',
      kind: 'wall',
      bounds: { x: 0,     y: H - 24, w: W,  h: 24 },
      solid: true,
    },
    {
      id: 'wall-left',
      kind: 'wall',
      bounds: { x: 0,     y: 0,      w: 28, h: H },
      solid: true,
    },
    {
      id: 'wall-right',
      kind: 'wall',
      bounds: { x: W - 28, y: 0,     w: 28, h: H },
      solid: true,
    },

    // ── Window — upper wall, slightly left of center ──────────────────
    {
      id: 'window-main',
      kind: 'window',
      bounds: { x: 330, y: 0, w: 150, h: 48 },
      solid: true,
      interact: false,
      meta: { panes: 2 },
    },

    // ── Door — left wall, lower half ─────────────────────────────────
    {
      id: 'door-main',
      kind: 'door',
      bounds: { x: 0, y: 200, w: 28, h: 110 },
      solid: false,       // passable (player exits here later)
      interact: true,
      noisy: true,
    },

    // ── Rug — center of the room ─────────────────────────────────────
    {
      id: 'rug-center',
      kind: 'rug',
      bounds: { x: 200, y: 260, w: 280, h: 160 },
      solid: false,
    },

    // ── Bed — top-right quadrant ─────────────────────────────────────
    {
      id: 'bed-main',
      kind: 'bed',
      bounds: { x: 590, y: 36, w: 340, h: 220 },
      solid: true,
      meta: { headboardSide: 'right' },
    },

    // ── Bedside table — left of bed ───────────────────────────────────
    {
      id: 'nightstand',
      kind: 'nightstand',
      bounds: { x: 530, y: 80, w: 60, h: 60 },
      solid: true,
      interact: true,
      noisy: false,
      meta: { hasLamp: true },
    },

    // ── Desk — bottom-left area ───────────────────────────────────────
    {
      id: 'desk-main',
      kind: 'desk',
      bounds: { x: 60, y: 320, w: 200, h: 80 },
      solid: true,
      interact: true,
      noisy: false,
    },

    // ── Chair — in front of desk ──────────────────────────────────────
    {
      id: 'chair-desk',
      kind: 'chair',
      bounds: { x: 110, y: 400, w: 70, h: 70 },
      solid: true,
      noisy: false,
    },

    // ── Bookshelf — bottom wall, right of desk ────────────────────────
    {
      id: 'bookshelf',
      kind: 'bookshelf',
      bounds: { x: 290, y: 420, w: 140, h: 50 },
      solid: true,
    },

    // ── Small decorations ─────────────────────────────────────────────
    {
      id: 'decor-plant',
      kind: 'decor',
      bounds: { x: 60, y: 60, w: 36, h: 36 },
      solid: true,
      meta: { type: 'plant' },
    },
    {
      id: 'decor-glass',
      kind: 'decor',
      bounds: { x: 540, y: 66, w: 14, h: 20 },
      solid: false,
      interact: true,
      meta: { type: 'glass' },
    },
  ],
};

function makeRoom(name: string, floorType: Room['floorType'], target: string, type: string, x: number, y: number): Room {
  const room = JSON.parse(JSON.stringify(BEDROOM)) as Room;
  room.name = name;
  room.floorType = floorType;
  room.objects = room.objects.filter((object) => object.id !== 'decor-glass');
  room.objects.push({ id: target, kind: 'decor', bounds: { x, y, w: 22, h: 22 }, solid: false, interact: true, noisy: true, meta: { type } });
  return room;
}

export const ROOMS: Record<string, Room> = {
  bedroom: BEDROOM,
  hallway: makeRoom('Hallway', 'wood', 'decor-keys', 'keys', 260, 210),
  kitchen: makeRoom('Kitchen', 'tile', 'decor-snacks', 'snacks', 160, 160),
  bathroom: makeRoom('Bathroom', 'tile', 'decor-phone', 'phone', 460, 320),
  livingRoom: makeRoom('Living Room', 'carpet', 'decor-headphones', 'headphones', 360, 190),
};
