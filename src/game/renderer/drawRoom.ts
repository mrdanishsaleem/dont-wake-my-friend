/**
 * drawRoom — renders the static and ambient structural elements of the bedroom:
 *   - wall with molding, subtle picture frame, and corner shadows
 *   - wood plank floor with grain highlights
 *   - window with animated twinkling night stars and moonbeam dust particles
 *   - bedside lamp soft warm glow
 *   - door with recess depth
 */

import type { Room } from '../../types';
import { box, vertGradFill } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

const C = {
  wallTop:      '#0d111e',
  wallMid:      '#0a0e18',
  floorBase:    '#111827',
  floorPlank:   '#0e1422',
  floorLight:   '#162032',
  floorHighlight: 'rgba(255,255,255,0.015)',
  baseboard:    '#1a2236',
  baseboardEdge:'#223048',
  windowFill:   '#080f20',
  windowFrame:  '#1e2f4a',
  windowDiv:    '#16233a',
  moonbeam:     'rgba(165,195,255,0.06)',
  doorFill:     '#0c1118',
  doorFrame:    '#1a2438',
  doorPanel:    '#111928',
  doorKnob:     '#334766',
  doorKnobHi:   '#4a658f',
  wallCorner:   '#060910',
};

// Seeded dust particles in the moonbeam
const DUST_PARTICLES = [
  { x: 380, y: 120, speed: 0.0008, size: 1.2, phase: 0 },
  { x: 410, y: 220, speed: 0.0006, size: 1.5, phase: 2 },
  { x: 350, y: 310, speed: 0.0009, size: 1.0, phase: 4 },
  { x: 440, y: 180, speed: 0.0007, size: 1.4, phase: 1.5 },
  { x: 390, y: 390, speed: 0.0005, size: 1.6, phase: 3.2 },
  { x: 460, y: 290, speed: 0.0008, size: 1.1, phase: 5.1 },
];

export function drawRoom(ctx: Ctx, room: Room, timestamp: number = 0): void {
  drawBackground(ctx, room.width, room.height);
  drawWallDetails(ctx, room.width, room.height);
  drawFloor(ctx, room.width, room.height);
  drawBaseboard(ctx, room.width, room.height);

  // Structural objects from data
  for (const obj of room.objects) {
    if (obj.kind === 'window') {
      drawWindow(ctx, obj.bounds.x, obj.bounds.y, obj.bounds.w, obj.bounds.h, room.height, timestamp);
    }
    if (obj.kind === 'door') {
      drawDoor(ctx, obj.bounds.x, obj.bounds.y, obj.bounds.w, obj.bounds.h);
    }
  }

  // Soft ambient glows
  drawAmbientGlows(ctx, room, timestamp);
  drawWallCorners(ctx, room.width, room.height);
}

// ── Background (upper wall) ──────────────────────────────────────────────────

function drawBackground(ctx: Ctx, W: number, H: number): void {
  vertGradFill(ctx, 0, 0, W, H * 0.52, C.wallTop, C.wallMid);
}

function drawWallDetails(ctx: Ctx, W: number, H: number): void {
  // Subtle picture frame on the wall left of the window
  const frameX = 140;
  const frameY = 50;
  const frameW = 60;
  const frameH = 44;

  box(ctx, frameX, frameY, frameW, frameH, '#141c2c', '#202d44', 1.5, 2);
  // Painting canvas inside
  ctx.fillStyle = '#0f1724';
  ctx.fillRect(frameX + 4, frameY + 4, frameW - 8, frameH - 8);

  // Stylized mountain & moon inside frame
  ctx.fillStyle = '#1e2d48';
  ctx.beginPath();
  ctx.moveTo(frameX + 6, frameY + frameH - 4);
  ctx.lineTo(frameX + frameW * 0.45, frameY + 16);
  ctx.lineTo(frameX + frameW - 6, frameY + frameH - 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(frameX + frameW * 0.72, frameY + 14, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

// ── Floor ────────────────────────────────────────────────────────────────────

function drawFloor(ctx: Ctx, W: number, H: number): void {
  const floorY = H * 0.50;
  const floorH = H - floorY;

  vertGradFill(ctx, 0, floorY, W, floorH, C.floorBase, '#0c121e');

  // Wood planks
  const plankCount = 9;
  const plankH = floorH / plankCount;

  for (let i = 0; i <= plankCount; i++) {
    const y = floorY + i * plankH;

    // Plank seam shadow
    ctx.strokeStyle = C.floorPlank;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();

    // Plank top subtle highlight
    if (i < plankCount) {
      ctx.strokeStyle = C.floorHighlight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + 1);
      ctx.lineTo(W, y + 1);
      ctx.stroke();
    }
  }

  // Staggered vertical plank joints
  ctx.strokeStyle = C.floorLight;
  ctx.lineWidth = 0.5;
  const joints = [120, 280, 440, 600, 760, 890];
  for (const jx of joints) {
    for (let row = 0; row < plankCount; row++) {
      const offsetX = row % 2 === 0 ? 0 : 75;
      const jy = floorY + row * plankH;
      ctx.beginPath();
      ctx.moveTo(jx + offsetX, jy);
      ctx.lineTo(jx + offsetX, jy + plankH);
      ctx.stroke();
    }
  }
}

// ── Baseboard ────────────────────────────────────────────────────────────────

function drawBaseboard(ctx: Ctx, W: number, H: number): void {
  const boardY = H * 0.50;
  // Main trim
  ctx.fillStyle = C.baseboard;
  ctx.fillRect(0, boardY - 8, W, 8);
  // Edge highlight
  ctx.fillStyle = C.baseboardEdge;
  ctx.fillRect(0, boardY - 9, W, 1);
}

// ── Window & Moonbeam ────────────────────────────────────────────────────────

function drawWindow(
  ctx: Ctx,
  x: number, y: number,
  w: number, h: number,
  canvasH: number,
  timestamp: number,
): void {
  // 1. Moonbeam cast into the room
  drawMoonbeam(ctx, x, y, w, canvasH, timestamp);

  // 2. Outer window frame
  box(ctx, x - 6, y, w + 12, h + 10, C.windowFrame, '#283c5a', 2, 2);

  // 3. Glass pane
  ctx.fillStyle = C.windowFill;
  ctx.fillRect(x, y, w, h);

  // 4. Twinkling stars in night sky
  drawStars(ctx, x, y, w, h, timestamp);

  // 5. Moon glow gradient
  const glow = ctx.createRadialGradient(x + w * 0.5, y + h * 0.4, 2, x + w * 0.5, y + h * 0.4, w * 0.85);
  glow.addColorStop(0,   'rgba(210, 230, 255, 0.25)');
  glow.addColorStop(0.4, 'rgba(140, 180, 255, 0.09)');
  glow.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  // 6. Pane dividers
  ctx.strokeStyle = C.windowDiv;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();

  // 7. Outer border
  ctx.strokeStyle = C.windowFrame;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function drawStars(ctx: Ctx, wx: number, wy: number, ww: number, wh: number, timestamp: number): void {
  const stars = [
    { x: 0.2, y: 0.25, baseA: 0.6, speed: 0.003 },
    { x: 0.35, y: 0.7,  baseA: 0.5, speed: 0.004 },
    { x: 0.75, y: 0.3,  baseA: 0.7, speed: 0.0025 },
    { x: 0.85, y: 0.65, baseA: 0.4, speed: 0.005 },
    { x: 0.55, y: 0.15, baseA: 0.65, speed: 0.0035 },
  ];

  for (const s of stars) {
    const alpha = s.baseA + Math.sin(timestamp * s.speed + s.x * 10) * 0.3;
    ctx.fillStyle = `rgba(240, 248, 255, ${Math.max(0.1, alpha)})`;
    ctx.fillRect(wx + s.x * ww, wy + s.y * wh, 1.5, 1.5);
  }
}

function drawMoonbeam(
  ctx: Ctx,
  wx: number, _wy: number, ww: number,
  canvasH: number,
  timestamp: number,
): void {
  const cx = wx + ww / 2;
  const spread = 240;
  const topY = 0;

  const grad = ctx.createLinearGradient(cx, topY, cx, canvasH);
  grad.addColorStop(0,    'rgba(165,195,255,0.075)');
  grad.addColorStop(0.55, 'rgba(155,185,255,0.03)');
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

  // Floating dust particles in the beam
  for (const p of DUST_PARTICLES) {
    const floatY = (p.y + Math.sin(timestamp * p.speed + p.phase) * 14) % canvasH;
    const floatX = p.x + Math.cos(timestamp * p.speed * 0.8 + p.phase) * 8;
    const alpha = 0.25 + Math.sin(timestamp * 0.002 + p.phase) * 0.15;

    ctx.fillStyle = `rgba(215, 235, 255, ${Math.max(0.05, alpha)})`;
    ctx.beginPath();
    ctx.arc(floatX, floatY, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Door ─────────────────────────────────────────────────────────────────────

function drawDoor(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = C.wallCorner;
  ctx.fillRect(x - 2, y - 4, w + 4, h + 8);

  box(ctx, x, y, w, h, C.doorFill, C.doorFrame, 2);

  const panelX = x + 4;
  const panelW = w - 8;
  const panelH = (h - 18) * 0.46;

  ctx.strokeStyle = C.doorPanel;
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, y + 6, panelW, panelH);
  ctx.strokeRect(panelX, y + 6 + panelH + 6, panelW, panelH);

  // Knob
  const kx = x + w - 8;
  const ky = y + h * 0.52;
  ctx.fillStyle = C.doorKnob;
  ctx.beginPath();
  ctx.arc(kx, ky, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.doorKnobHi;
  ctx.beginPath();
  ctx.arc(kx - 1, ky - 1, 2, 0, Math.PI * 2);
  ctx.fill();

  // Outer frame
  ctx.strokeStyle = C.doorFrame;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

// ── Soft Ambient Glows (Lamp / Screen) ────────────────────────────────────────

function drawAmbientGlows(ctx: Ctx, room: Room, timestamp: number): void {
  const nightstand = room.objects.find((o) => o.id === 'nightstand');
  if (nightstand) {
    const lampX = nightstand.bounds.x + nightstand.bounds.w * 0.5;
    const lampY = nightstand.bounds.y - 20;

    // Very subtle warm glow around lamp
    const lampGlow = ctx.createRadialGradient(lampX, lampY, 2, lampX, lampY, 65);
    lampGlow.addColorStop(0, 'rgba(251, 191, 36, 0.045)');
    lampGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = lampGlow;
    ctx.fillRect(lampX - 65, lampY - 65, 130, 130);
  }
}

function drawWallCorners(ctx: Ctx, W: number, _H: number): void {
  ctx.fillStyle = C.wallCorner;
  ctx.fillRect(0, 0, 28, 28);
  ctx.fillRect(W - 28, 0, 28, 28);
}
