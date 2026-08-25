/**
 * drawFriend — renders the sleeping (or waking) friend on the bed with state-driven reactions and Zzz animation.
 */

import type { Room, RenderState, FriendState } from '../../types';
import { fillRoundRect } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  body:       '#2c3a50',
  bodyDark:   '#1e2a3c',
  head:       '#c49a7a',      // warm skin tone
  headShadow: '#a07858',
  hair:       '#1a1010',
  pillow:     '#2e4060',
  sweat:      '#7dd3fc',
};

// ZZZ config
const ZZZ_COUNT  = 3;
const ZZZ_CYCLE  = 3200;  // ms for a full cycle of all Zs

export function drawFriend(ctx: Ctx, room: Room, state: RenderState): void {
  const bed = room.objects.find((o) => o.id === 'bed-main');
  if (!bed) return;

  const b = bed.bounds;
  const friendState: FriendState = state.wake.friendState;
  const isAwake = friendState === 'AWAKE';
  const isAlmostAwake = friendState === 'ALMOST_AWAKE';
  const isRestless = friendState === 'RESTLESS';

  // Jitter calculation based on restlessness
  let jitterX = 0;
  let jitterY = 0;
  if (isAlmostAwake) {
    jitterX = Math.sin(state.timestamp * 0.035) * 2.2;
    jitterY = Math.cos(state.timestamp * 0.045) * 1.8;
  } else if (isRestless) {
    jitterX = Math.sin(state.timestamp * 0.02) * 1.0;
    jitterY = Math.cos(state.timestamp * 0.025) * 0.8;
  }

  const headR   = 14;
  const bodyW   = b.w * 0.50;
  const bodyH   = b.h * 0.22;
  const headX   = b.x + b.w - 40 + jitterX;
  const friendY = b.y + b.h * 0.36 + (isAwake ? -6 : 0) + jitterY;

  // ── Under-body shadow ─────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur    = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle     = 'rgba(0,0,0,0.01)';
  ctx.fillRect(headX - bodyW - 10, friendY - bodyH / 2 - 4, bodyW + headR * 2 + 10, bodyH + 8);
  ctx.restore();

  // ── Body under covers ─────────────────────────────────────────────
  const bodyX = headX - bodyW;
  fillRoundRect(ctx, bodyX, friendY - bodyH / 2, bodyW, bodyH, bodyH / 2, C.body);
  fillRoundRect(ctx, bodyX + 10, friendY - bodyH / 2 + 3, bodyW - 20, bodyH - 6, bodyH / 4, C.bodyDark);

  // Blanket edge / shoulder
  ctx.fillStyle = 'rgba(30,47,66,0.6)';
  ctx.beginPath();
  ctx.ellipse(headX - 14, friendY, 22, bodyH / 2 + 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Head ──────────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor   = isAwake ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0,0,0,0.6)';
  ctx.shadowBlur    = isAwake ? 14 : 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle     = C.head;
  ctx.beginPath();
  ctx.ellipse(headX, friendY, headR, headR * 0.88, isAwake ? -0.1 : 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cheek shadow
  ctx.fillStyle = C.headShadow;
  ctx.beginPath();
  ctx.ellipse(headX - 2, friendY + 4, headR * 0.6, headR * 0.45, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = C.hair;
  ctx.beginPath();
  ctx.ellipse(headX + 2, friendY - headR * 0.5, headR * 0.85, headR * 0.55, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // ── Eyes / Expression based on FriendState ────────────────────────
  if (isAwake) {
    // Wide open alert eyes looking straight out!
    drawAwakeEyes(ctx, headX, friendY);
    // Shocked open mouth
    ctx.fillStyle = '#451a1a';
    ctx.beginPath();
    ctx.ellipse(headX - 2, friendY + 5, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (isAlmostAwake) {
    // Furrowed, twitching closed eyes
    drawRestlessEyes(ctx, headX, friendY, true);
    // Tense mouth
    ctx.strokeStyle = '#6e4533';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headX - 3, friendY + 5);
    ctx.lineTo(headX + 3, friendY + 4);
    ctx.stroke();
    // Sweat drop
    drawSweat(ctx, headX + 6, friendY - 6);
  } else if (isRestless) {
    // Uneasy closed eyes
    drawRestlessEyes(ctx, headX, friendY, false);
    // Flat sleeping mouth
    ctx.strokeStyle = '#8a6a54';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headX - 2, friendY + 5);
    ctx.lineTo(headX + 2, friendY + 5);
    ctx.stroke();
    // Small sweat drop
    drawSweat(ctx, headX + 6, friendY - 6);
  } else {
    // Peaceful deep sleep
    drawDeepSleepEyes(ctx, headX, friendY);
    // Peaceful curved mouth
    ctx.beginPath();
    ctx.arc(headX, friendY + 5, 3, Math.PI * 0.1, Math.PI * 0.9, false);
    ctx.strokeStyle = '#8a6a54';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Alert indicator or Zzz animation ──────────────────────────────
  if (isAwake) {
    drawAlertIcon(ctx, headX, friendY - 24, state.timestamp);
  } else {
    drawZzz(ctx, headX, friendY, state.timestamp, friendState);
  }
}

// ── Eye Renderers ─────────────────────────────────────────────────────────────

function drawDeepSleepEyes(ctx: Ctx, hx: number, hy: number): void {
  ctx.strokeStyle = '#7a5a44';
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';

  ctx.beginPath();
  ctx.arc(hx - 5, hy + 1, 3.5, Math.PI * 1.1, Math.PI * 1.9, false);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(hx + 4, hy + 1, 3.5, Math.PI * 1.1, Math.PI * 1.9, false);
  ctx.stroke();
}

function drawRestlessEyes(ctx: Ctx, hx: number, hy: number, furrowed: boolean): void {
  ctx.strokeStyle = '#5a3d2c';
  ctx.lineWidth   = furrowed ? 2 : 1.5;
  ctx.lineCap     = 'round';

  // Squeezed shut lines
  ctx.beginPath();
  ctx.moveTo(hx - 8, hy + 1);
  ctx.lineTo(hx - 2, hy + (furrowed ? 2 : 1));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(hx + 1, hy + (furrowed ? 2 : 1));
  ctx.lineTo(hx + 7, hy + 1);
  ctx.stroke();

  if (furrowed) {
    // Brow creases
    ctx.strokeStyle = '#6e4533';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx - 7, hy - 3);
    ctx.lineTo(hx - 2, hy - 1);
    ctx.moveTo(hx + 1, hy - 1);
    ctx.lineTo(hx + 6, hy - 3);
    ctx.stroke();
  }
}

function drawAwakeEyes(ctx: Ctx, hx: number, hy: number): void {
  // Sclera (whites of eyes)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(hx - 5, hy + 1, 3.5, 4.5, 0, 0, Math.PI * 2);
  ctx.ellipse(hx + 4, hy + 1, 3.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sharp pupils
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(hx - 6, hy + 1, 1.8, 0, Math.PI * 2);
  ctx.arc(hx + 3, hy + 1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows raised in alarm
  ctx.strokeStyle = '#2d1810';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(hx - 8, hy - 4);
  ctx.lineTo(hx - 2, hy - 5);
  ctx.moveTo(hx + 1, hy - 5);
  ctx.lineTo(hx + 7, hy - 4);
  ctx.stroke();
}

function drawSweat(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = C.sweat;
  ctx.beginPath();
  ctx.arc(x, y + 2, 2, 0, Math.PI * 2);
  ctx.moveTo(x - 2, y + 2);
  ctx.lineTo(x, y - 2);
  ctx.lineTo(x + 2, y + 2);
  ctx.fill();
}

function drawAlertIcon(ctx: Ctx, x: number, y: number, timestamp: number): void {
  const pulse = 1 + Math.sin(timestamp * 0.015) * 0.15;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);

  ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
  ctx.shadowBlur = 10;
  ctx.font = 'bold 20px "Space Mono", monospace';
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'center';
  ctx.fillText('!', 0, 0);
  ctx.restore();
}

function drawZzz(
  ctx: Ctx,
  headX: number,
  headY: number,
  timestamp: number,
  state: FriendState,
): void {
  const isRestless = state === 'RESTLESS';
  const isAlmostAwake = state === 'ALMOST_AWAKE';

  // Faster or jittery cycle when restless
  const cycleTime = isAlmostAwake ? 2000 : isRestless ? 2500 : ZZZ_CYCLE;
  const t = (timestamp % cycleTime) / cycleTime;

  for (let i = 0; i < ZZZ_COUNT; i++) {
    const phase = (t + i / ZZZ_COUNT) % 1;
    if (phase < 0.08) continue;

    const riseT = (phase - 0.08) / 0.92;
    const alpha = riseT < 0.3
      ? riseT / 0.3
      : riseT > 0.7
        ? (1 - riseT) / 0.3
        : 1;

    const yOffset = -28 - riseT * 46;
    let xOffset = 14 + i * 6 + riseT * 8;
    if (isAlmostAwake) {
      xOffset += Math.sin(timestamp * 0.02 + i) * 3;
    }

    const size = 8 + i * 2.5;

    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.font = `bold ${size}px 'Space Mono', monospace`;

    if (isAlmostAwake) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    } else if (isRestless) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
    } else {
      ctx.fillStyle = 'rgba(180, 210, 255, 0.9)';
      ctx.shadowColor = 'rgba(160, 200, 255, 0.4)';
    }

    ctx.shadowBlur = 6;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const char = isAlmostAwake && i === 0 ? 'z' : 'Z';
    ctx.fillText(char, headX + xOffset, headY + yOffset);
    ctx.restore();
  }
}
