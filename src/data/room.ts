import { CHARACTER_LENGTH } from '../game/renderer/characterScale';
import type { Rect, Room } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';

const W = CANVAS_WIDTH;   // 960
const H = CANVAS_HEIGHT;  // 540

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
      bounds: { x: 300, y: 0, w: 184, h: 54 },
      solid: true,
      interact: false,
      meta: { panes: 2 },
    },

    // ── Door — left wall, lower half ─────────────────────────────────
    {
      id: 'door-main',
      kind: 'door',
      bounds: { x: 0, y: 195, w: 28, h: 112 },
      solid: false,       // passable (player exits here later)
      interact: true,
      noisy: true,
    },

    // ── Rug — center of the room ─────────────────────────────────────
    {
      id: 'rug-center',
      kind: 'rug',
      bounds: { x: 311, y: 182, w: 270, h: 191 },
      solid: false,
    },

    // ── Bed — top-right quadrant ─────────────────────────────────────
    {
      id: 'bed-main',
      kind: 'bed',
      bounds: { x: 590, y: 68, w: CHARACTER_LENGTH, h: 90 },
      solid: true,
      meta: { headboardSide: 'right' },
    },

    // ── Bedside table — left of bed ───────────────────────────────────
    {
      id: 'nightstand',
      kind: 'nightstand',
      bounds: { x: 740, y: 87, w: 70, h: 62 },
      solid: true,
      interact: true,
      noisy: false,
      meta: { hasLamp: true },
    },

    // ── Desk — bottom-left area ───────────────────────────────────────
    {
      id: 'desk-main',
      kind: 'desk',
      bounds: { x: 133, y: 326, w: 182, h: 78 },
      solid: true,
      interact: true,
      noisy: false,
    },

    // ── Chair — in front of desk ──────────────────────────────────────
    {
      id: 'chair-desk',
      kind: 'chair',
      bounds: { x: 189, y: 414, w: 58, h: 58 },
      solid: true,
      noisy: false,
    },

    // ── Bookshelf — bottom wall, right of desk ────────────────────────
    {
      id: 'bookshelf',
      kind: 'bookshelf',
      bounds: { x: 345, y: 457, w: 174, h: 50 },
      solid: true,
    },

    // ── Small decorations ─────────────────────────────────────────────
    {
      id: 'decor-plant',
      kind: 'decor',
      bounds: { x: 56, y: 60, w: 49, h: 49 },
      solid: true,
      meta: { type: 'plant' },
    },
    {
      id: 'decor-glass',
      kind: 'decor',
      bounds: { x: 785, y: 120, w: 18, h: 25 },
      solid: false,
      interact: true,
      meta: { type: 'glass' },
    },
  ],
};

function makeRoom(
  name: string, floorType: Room['floorType'], target: string, type: string, bounds: Rect,
): Room {
  const room = JSON.parse(JSON.stringify(BEDROOM)) as Room;
  room.name = name;
  room.floorType = floorType;
  room.objects = room.objects.filter((object) => object.id !== 'decor-glass');
  room.objects.push({ id: target, kind: 'decor', bounds, solid: false, interact: true, noisy: true, meta: { type } });
  return room;
}

export const ROOMS: Record<string, Room> = {
  bedroom: BEDROOM,
  hallway: makeRoom('Hallway', 'wood', 'decor-keys', 'keys', { x: 456, y: 461, w: 24, h: 26 }),
  kitchen: makeRoom('Kitchen', 'tile', 'decor-snacks', 'snacks', { x: 279, y: 329, w: 29, h: 35 }),
  bathroom: makeRoom('Bathroom', 'tile', 'decor-phone', 'phone', { x: 785, y: 113, w: 20, h: 31 }),
  livingRoom: makeRoom('Living Room', 'carpet', 'decor-headphones', 'headphones', { x: 273, y: 329, w: 36, h: 36 }),
};
