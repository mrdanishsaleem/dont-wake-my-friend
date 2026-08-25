/**
 * drawRoom — renders the static structural elements of the bedroom:
 *   - background / ceiling colour
 *   - floor with wood-plank texture lines
 *   - wall baseboard
 *   - window (top wall) with moonbeam
 *   - door (left wall)
 *   - skirting / corner details
 */

import type { Room } from '../../types';
import { box, vertGradFill } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

// ── Palette (night-time) ──────────────────────────────────────────────────────
const C = {
  wallTop:      '#0e1220',
  wallMid:      '#0c1019',
  floorBase:    '#111826',
  floorPlank:   '#0f1522',
  floorLight:   '#141d2e',
  baseboard:    '#1a2236',
  baseboardEdge:'#202d42',
  windowFill:   '#0d1830',
  windowGlow:   'rgba(170,200,255,0.14)',
  windowFrame:  '#1e2f4a',
  windowDiv:    '#182540',
  moonbeam:     'rgba(155,185,255,0.055)',
  doorFill:     '#0c1118',
  doorFrame:    '#1a2438',
  doorPanel:    '#111928',
  doorKnob:     '#2c3d58',
  doorKnobHi:   '#3d5270',
  wallCorner:   '#0a0e18',
};

// ─────────────────────────────────────────────────────────────────────────────

export function drawRoom(ctx: Ctx, room: Room): void {
  drawBackground(ctx, room.width, room.height);
  drawFloor(ctx, room.width, room.height);
  drawBaseboard(ctx, room.width, room.height);

  // Structural objects from data
  for (const obj of room.objects) {
    if (obj.kind === 'window') drawWindow(ctx, obj.bounds.x, obj.bounds.y, obj.bounds.w, obj.bounds.h, room.height);
    if (obj.kind === 'door')   drawDoor(ctx, obj.bounds.x, obj.bounds.y, obj.bounds.w, obj.bounds.h);
  }

  drawWallCorners(ctx, room.width, room.height);
}

// ── Background (upper wall area) ─────────────────────────────────────────────

function drawBackground(ctx: Ctx, W: number, H: number): void {
  // Top wall — darkest
  vertGradFill(ctx, 0, 0, W, H * 0.55, C.wallTop, C.wallMid);
}

// ── Floor ────────────────────────────────────────────────────────────────────

function drawFloor(ctx: Ctx, W: number, H: number): void {
  const floorY = H * 0.52;
  const floorH = H - floorY;

  vertGradFill(ctx, 0, floorY, W, floorH, C.floorBase, C.floorBase);

  // Horizontal wood-plank lines (very subtle)
  const plankCount = 8;
  const plankH = floorH / plankCount;
  ctx.strokeStyle = C.floorPlank;
  ctx.lineWidth = 1;
  for (let i = 0; i <= plankCount; i++) {
    const y = floorY + i * plankH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Occasional plank end joints (vertical short lines)
  ctx.strokeStyle = C.floorLight;
  ctx.lineWidth = 0.5;
  const joints = [180, 380, 560, 720, 850];
  for (const jx of joints) {
    for (let row = 0; row < plankCount; row++) {
      // Offset every other row so joints don't align
      const offsetX = row % 2 === 0 ? 0 : 90;
      const jy = floorY + row * plankH;
      ctx.beginPath();
      ctx.moveTo(jx + offsetX, jy);
      ctx.lineTo(jx + offsetX, jy + plankH);
      ctx.stroke();
    }
  }
}

// ── Baseboard (wall-meets-floor trim) ────────────────────────────────────────

function drawBaseboard(ctx: Ctx, W: number, H: number): void {
  const boardY = H * 0.52;
  // Main trim strip
  ctx.fillStyle = C.baseboard;
  ctx.fillRect(0, boardY - 8, W, 8);
  // Highlight edge
  ctx.fillStyle = C.baseboardEdge;
  ctx.fillRect(0, boardY - 9, W, 1);
}

// ── Window ───────────────────────────────────────────────────────────────────

function drawWindow(
  ctx: Ctx,
  x: number, y: number,
  w: number, h: number,
  canvasH: number,
): void {
  // Moonbeam cast first (behind everything)
  drawMoonbeam(ctx, x, y, w, canvasH);

  // Window sill / outer frame
  box(ctx, x - 6, y, w + 12, h + 10, C.windowFrame, '#253550', 2, 2);

  // Glass pane fill
  ctx.fillStyle = C.windowFill;
  ctx.fillRect(x, y, w, h);

  // Moon glow gradient inside pane
  const glow = ctx.createRadialGradient(x + w * 0.5, y + h * 0.4, 2, x + w * 0.5, y + h * 0.4, w * 0.8);
  glow.addColorStop(0,   'rgba(200, 225, 255, 0.20)');
  glow.addColorStop(0.4, 'rgba(140, 180, 255, 0.08)');
  glow.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  // Pane dividers
  ctx.strokeStyle = C.windowDiv;
  ctx.lineWidth = 2;
  // Vertical centre divider
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
  // Horizontal centre divider
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();

  // Outer border
  ctx.strokeStyle = C.windowFrame;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  // Small moon circle hint in upper-left pane
  ctx.beginPath();
  ctx.arc(x + w * 0.28, y + h * 0.3, 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220,235,255,0.12)';
  ctx.fill();
}

function drawMoonbeam(ctx: Ctx, wx: number, _wy: number, ww: number, canvasH: number): void {
  const cx = wx + ww / 2;
  const spread = 220;
  const topY = 0;

  const grad = ctx.createLinearGradient(cx, topY, cx, canvasH);
  grad.addColorStop(0,    C.moonbeam);
  grad.addColorStop(0.55, 'rgba(155,185,255,0.025)');
  grad.addColorStop(1,    'rgba(155,185,255,0)');

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(wx, topY);
  ctx.lineTo(wx + ww, topY);
  ctx.lineTo(cx + spread, canvasH);
  ctx.lineTo(cx - spread, canvasH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

// ── Door ─────────────────────────────────────────────────────────────────────

function drawDoor(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  // Door recess / jamb shadow
  ctx.fillStyle = C.wallCorner;
  ctx.fillRect(x - 2, y - 4, w + 4, h + 8);

  // Door body
  box(ctx, x, y, w, h, C.doorFill, C.doorFrame, 2);

  // Door panels (inset detail)
  const panelX = x + 4;
  const panelW = w - 8;
  const panelH = (h - 18) * 0.46;

  ctx.strokeStyle = C.doorPanel;
  ctx.lineWidth = 1;
  // Upper panel
  ctx.strokeRect(panelX, y + 6, panelW, panelH);
  // Lower panel
  ctx.strokeRect(panelX, y + 6 + panelH + 6, panelW, panelH);

  // Knob (circle with highlight)
  const kx = x + w - 8;
  const ky = y + h * 0.52;
  ctx.fillStyle = C.doorKnob;
  ctx.beginPath();
  ctx.arc(kx, ky, 5, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = C.doorKnobHi;
  ctx.beginPath();
  ctx.arc(kx - 1, ky - 1, 2, 0, Math.PI * 2);
  ctx.fill();

  // Door frame trim (top + sides inside wall)
  ctx.strokeStyle = C.doorFrame;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

// ── Corner accents ────────────────────────────────────────────────────────────

function drawWallCorners(ctx: Ctx, W: number, H: number): void {
  ctx.fillStyle = C.wallCorner;
  // Top-left
  ctx.fillRect(0, 0, 28, 28);
  // Top-right
  ctx.fillRect(W - 28, 0, 28, 28);
}
