/**
 * drawPlayer — renders the player character with stylized pixel-art details:
 *   - animated walking feet / shoes with stepping cycle
 *   - direction-aware hair, torso, and eye direction
 *   - soft realistic drop shadow and movement glow
 */

import type { PlayerState, RenderState } from '../../types';
import { fillRoundRect } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

const C = {
  shadow:    'rgba(0,0,0,0.5)',
  bodyFill:  '#1e6a8a',
  bodyEdge:  '#4ab0d8',
  bodyShade: '#155a76',
  headFill:  '#e8c99a',
  headEdge:  '#f0d8b0',
  headShade: '#c8a070',
  hair:      '#231818',
  shoes:     '#0e1726',
  shoeEdge:  '#38bdf8',
  eyeDot:    '#0f172a',
  glowRing:  'rgba(74, 176, 216, 0.25)',
};

const BOB_FREQ = 5.5;
const BOB_AMP  = 1.5;

export function drawPlayer(ctx: Ctx, rs: RenderState): void {
  const { player: p, timestamp } = rs;

  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;

  // Walking bob
  const bob = p.moving
    ? Math.sin((timestamp / 1000) * BOB_FREQ * Math.PI * 2) * BOB_AMP
    : 0;

  // ── 1. Drop shadow ───────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, p.w * 0.55, p.h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── 2. Animated Feet / Shoes (draw beneath body) ─────────────────────
  drawFeet(ctx, p, timestamp, bob);

  // ── 3. Subtle Movement Glow ──────────────────────────────────────────
  if (p.moving) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = C.glowRing;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, p.w * 0.65, p.h * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ── 4. Torso / Body ──────────────────────────────────────────────────
  const bodyX = p.x + 2;
  const bodyY = p.y + 4 + bob;
  const bodyW = p.w - 4;
  const bodyH = p.h - 6;

  // Body shade (depth)
  fillRoundRect(ctx, bodyX, bodyY + bodyH * 0.38, bodyW, bodyH * 0.62, 4, C.bodyShade);
  // Main shirt fill
  fillRoundRect(ctx, bodyX, bodyY, bodyW, bodyH, 5, C.bodyFill);
  // Outline
  ctx.strokeStyle = C.bodyEdge;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH, 5);
  ctx.stroke();

  // Collar crease
  ctx.strokeStyle = 'rgba(74, 176, 216, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bodyX + 4, bodyY + bodyH * 0.45);
  ctx.lineTo(bodyX + bodyW - 4, bodyY + bodyH * 0.45);
  ctx.stroke();

  // ── 5. Head ──────────────────────────────────────────────────────────
  const headR = 5.5;
  const headPos = getHeadPosition(p.x, p.y, p.w, p.h, p.facing, bob);

  // Head shadow
  ctx.fillStyle = C.headShade;
  ctx.beginPath();
  ctx.ellipse(headPos.x + 0.5, headPos.y + 1, headR * 0.85, headR * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head base
  ctx.fillStyle = C.headFill;
  ctx.beginPath();
  ctx.arc(headPos.x, headPos.y, headR, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  drawHair(ctx, headPos.x, headPos.y, headR, p.facing);

  // Head outline
  ctx.strokeStyle = C.headEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(headPos.x, headPos.y, headR, 0, Math.PI * 2);
  ctx.stroke();

  // ── 6. Eyes ──────────────────────────────────────────────────────────
  drawEyes(ctx, headPos.x, headPos.y, headR, p.facing);
}

function drawFeet(ctx: Ctx, p: PlayerState, timestamp: number, _bob: number): void {
  const stepPhase = (timestamp / 1000) * BOB_FREQ * Math.PI * 2;
  const footSwing = p.moving ? Math.sin(stepPhase) * 2.5 : 0;

  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;

  ctx.save();
  ctx.fillStyle = C.shoes;
  ctx.strokeStyle = C.shoeEdge;
  ctx.lineWidth = 0.8;

  if (p.facing === 'up' || p.facing === 'down') {
    // Left foot
    const f1x = cx - 5;
    const f1y = cy + 4 + (p.facing === 'up' ? -footSwing : footSwing);
    ctx.fillRect(f1x - 2, f1y - 2, 4, 5);
    ctx.strokeRect(f1x - 2, f1y - 2, 4, 5);

    // Right foot
    const f2x = cx + 5;
    const f2y = cy + 4 + (p.facing === 'up' ? footSwing : -footSwing);
    ctx.fillRect(f2x - 2, f2y - 2, 4, 5);
    ctx.strokeRect(f2x - 2, f2y - 2, 4, 5);
  } else {
    // Left or right facing feet
    const f1x = cx + (p.facing === 'right' ? footSwing : -footSwing);
    const f1y = cy + 4;
    ctx.fillRect(f1x - 3, f1y - 2, 6, 4);
    ctx.strokeRect(f1x - 3, f1y - 2, 6, 4);
  }

  ctx.restore();
}

function drawHair(ctx: Ctx, hx: number, hy: number, headR: number, facing: PlayerState['facing']): void {
  ctx.fillStyle = C.hair;
  ctx.beginPath();

  if (facing === 'down') {
    // Hair on top and back of head
    ctx.ellipse(hx, hy - 2, headR * 0.9, headR * 0.6, 0, 0, Math.PI * 2);
  } else if (facing === 'up') {
    // Hair covers most of head
    ctx.ellipse(hx, hy, headR * 0.95, headR * 0.9, 0, 0, Math.PI * 2);
  } else if (facing === 'left') {
    // Hair parted to right
    ctx.ellipse(hx + 1.5, hy - 1, headR * 0.8, headR * 0.8, 0, 0, Math.PI * 2);
  } else {
    // Hair parted to left
    ctx.ellipse(hx - 1.5, hy - 1, headR * 0.8, headR * 0.8, 0, 0, Math.PI * 2);
  }
  ctx.fill();
}

function getHeadPosition(
  px: number, py: number,
  pw: number, ph: number,
  facing: PlayerState['facing'],
  bob: number,
): { x: number; y: number } {
  const cx = px + pw / 2;
  const cy = py + ph / 2 + bob;

  switch (facing) {
    case 'up':    return { x: cx,          y: py + 2 + bob };
    case 'down':  return { x: cx,          y: py + ph - 2 + bob };
    case 'left':  return { x: px + 2,      y: cy };
    case 'right': return { x: px + pw - 2, y: cy };
  }
}

function drawEyes(
  ctx: Ctx,
  hx: number, hy: number,
  _headR: number,
  facing: PlayerState['facing'],
): void {
  if (facing === 'up') return; // Head facing away, eyes hidden

  const forward = 2.2;
  const spread  = 2.0;

  let e1x: number, e1y: number, e2x: number, e2y: number;

  switch (facing) {
    case 'down':
      e1x = hx - spread; e1y = hy + forward;
      e2x = hx + spread; e2y = hy + forward;
      break;
    case 'left':
      e1x = hx - forward; e1y = hy - spread * 0.7;
      e2x = hx - forward; e2y = hy + spread * 0.7;
      break;
    case 'right':
      e1x = hx + forward; e1y = hy - spread * 0.7;
      e2x = hx + forward; e2y = hy + spread * 0.7;
      break;
    default:
      e1x = hx; e1y = hy; e2x = hx; e2y = hy;
  }

  ctx.fillStyle = C.eyeDot;
  ctx.beginPath();
  ctx.arc(e1x, e1y, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(e2x, e2y, 1.2, 0, Math.PI * 2);
  ctx.fill();
}
