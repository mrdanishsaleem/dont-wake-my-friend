/**
 * drawPlayer — renders the player character as a stylized top-down figure.
 *
 * The character is drawn relative to (state.x, state.y) which is the
 * top-left corner of their collision box.
 *
 * Visual anatomy (top-down view):
 *  - Body: rounded rectangle, slightly taller than wide
 *  - Head: circle at the front edge (indicates facing direction)
 *  - Subtle shadow beneath
 *  - Walking animation: body bob when moving (driven by timestamp)
 *  - Direction indicator: a small bright dot on the face side
 *
 * All colours use a teal/blue palette so the player stands out from the
 * warm-brown/dark-navy bedroom environment.
 */

import type { PlayerState, RenderState } from '../../types';
import { fillRoundRect } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  shadow:    'rgba(0,0,0,0.45)',
  bodyFill:  '#1e6a8a',
  bodyEdge:  '#4ab0d8',
  bodyShade: '#155a76',
  headFill:  '#e8c99a',
  headEdge:  '#f0d8b0',
  headShade: '#c8a070',
  eyeDot:    '#1a1a2e',
  // Glow ring when moving
  glowRing:  'rgba(74, 176, 216, 0.22)',
};

/** Step frequency: full bob cycle per second when walking. */
const BOB_FREQ = 5.5;
/** Max bob offset in pixels. */
const BOB_AMP  = 1.5;

// ─────────────────────────────────────────────────────────────────────────────

export function drawPlayer(ctx: Ctx, rs: RenderState): void {
  const { player: p, timestamp } = rs;

  // Centre of the collision box
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;

  // Bob offset — tiny vertical oscillation while walking
  const bob = p.moving
    ? Math.sin((timestamp / 1000) * BOB_FREQ * Math.PI * 2) * BOB_AMP
    : 0;

  // ── Drop shadow ───────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor  = C.shadow;
  ctx.shadowBlur   = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle    = 'rgba(0,0,0,0.01)';
  ctx.fillRect(p.x - 2, p.y + 2, p.w + 4, p.h + 4);
  ctx.restore();

  // ── Glow ring (visible when moving) ──────────────────────────────
  if (p.moving) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = C.glowRing;
    ctx.lineWidth   = 6;
    ctx.beginPath();
    ctx.ellipse(cx, cy + bob, p.w * 0.7, p.h * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ── Body ──────────────────────────────────────────────────────────
  // Draw the body slightly offset by the bob value
  const bodyX = p.x + 2;
  const bodyY = p.y + 4 + bob;
  const bodyW = p.w - 4;
  const bodyH = p.h - 6;

  // Body shade (bottom half, gives depth)
  fillRoundRect(ctx, bodyX, bodyY + bodyH * 0.4, bodyW, bodyH * 0.6, 4, C.bodyShade);
  // Main body fill
  fillRoundRect(ctx, bodyX, bodyY, bodyW, bodyH, 5, C.bodyFill);
  // Body outline
  ctx.strokeStyle = C.bodyEdge;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH, 5);
  ctx.stroke();

  // Subtle torso line (shirt crease)
  ctx.strokeStyle = 'rgba(30, 100, 140, 0.5)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(bodyX + 3,       bodyY + bodyH * 0.52);
  ctx.lineTo(bodyX + bodyW - 3, bodyY + bodyH * 0.52);
  ctx.stroke();

  // ── Head ──────────────────────────────────────────────────────────
  const headR  = 5.5;
  const headPos = getHeadPosition(p.x, p.y, p.w, p.h, p.facing, bob);

  // Head shadow fill (off-center)
  ctx.fillStyle = C.headShade;
  ctx.beginPath();
  ctx.ellipse(headPos.x + 0.5, headPos.y + 1, headR * 0.85, headR * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head fill
  ctx.fillStyle = C.headFill;
  ctx.beginPath();
  ctx.arc(headPos.x, headPos.y, headR, 0, Math.PI * 2);
  ctx.fill();

  // Head edge
  ctx.strokeStyle = C.headEdge;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(headPos.x, headPos.y, headR, 0, Math.PI * 2);
  ctx.stroke();

  // ── Eyes — two small dots oriented toward facing direction ────────
  drawEyes(ctx, headPos.x, headPos.y, headR, p.facing);
}

// ── Head position — placed at the leading edge for the facing direction ───────

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

// ── Eyes — two tiny dots on the face, oriented toward movement ────────────────

function drawEyes(
  ctx: Ctx,
  hx: number, hy: number,
  headR: number,
  facing: PlayerState['facing'],
): void {
  // Offset from head centre to place eyes toward the front of the head
  const forward = 2.2;
  const spread  = 2.0;

  let e1x: number, e1y: number, e2x: number, e2y: number;

  switch (facing) {
    case 'up':
      e1x = hx - spread; e1y = hy - forward;
      e2x = hx + spread; e2y = hy - forward;
      break;
    case 'down':
      e1x = hx - spread; e1y = hy + forward;
      e2x = hx + spread; e2y = hy + forward;
      break;
    case 'left':
      e1x = hx - forward; e1y = hy - spread;
      e2x = hx - forward; e2y = hy + spread;
      break;
    case 'right':
      e1x = hx + forward; e1y = hy - spread;
      e2x = hx + forward; e2y = hy + spread;
      break;
    default:
      e1x = hx; e1y = hy; e2x = hx; e2y = hy;
  }

  // Only draw eyes if head is large enough to show them
  if (headR < 4) return;

  ctx.fillStyle = C.eyeDot;
  ctx.beginPath();
  ctx.arc(e1x, e1y, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(e2x, e2y, 1.2, 0, Math.PI * 2);
  ctx.fill();
}
