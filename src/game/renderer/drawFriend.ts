/**
 * drawFriend — renders the sleeping (or waking) friend on the bed with dynamic AI poses,
 * breathing animations, expressions, speech mumbles, and Zzz cycles.
 */

import type { Room, RenderState, FriendState, FriendAIState } from '../../types';
import { fillRoundRect } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

const C = {
  body:       '#2c3a50',
  bodyDark:   '#1e2a3c',
  head:       '#c49a7a',      // warm skin tone
  headShadow: '#a07858',
  hair:       '#1a1010',
  pillow:     '#2e4060',
  sweat:      '#7dd3fc',
};

const ZZZ_COUNT = 3;
const ZZZ_CYCLE = 3200;

export function drawFriend(ctx: Ctx, room: Room, renderState: RenderState): void {
  const bed = room.objects.find((o) => o.id === 'bed-main');
  if (!bed) return;

  const b = bed.bounds;
  const ai: FriendAIState | undefined = renderState.friendAI;
  const friendState: FriendState = ai?.state ?? renderState.wake.friendState;

  const isAwake = friendState === 'AWAKE';
  const isAlmostAwake = friendState === 'ALMOST_AWAKE';
  const isRestless = friendState === 'RESTLESS';

  // Breathing & Jitter offsets
  const breathOffset = ai?.breathingOffset ?? Math.sin(renderState.timestamp * 0.002) * 1.2;
  const headOffX = ai?.headOffset.x ?? 0;
  const headOffY = ai?.headOffset.y ?? 0;
  const bodyOffY = ai?.bodyOffset.y ?? 0;
  const sitUpProgress = ai?.sitUpProgress ?? (isAwake ? 1 : 0);
  const facingAngle = ai?.facingAngle ?? 0;

  let jitterX = 0;
  let jitterY = 0;
  if (isAlmostAwake) {
    jitterX = Math.sin(renderState.timestamp * 0.035) * 1.8;
    jitterY = Math.cos(renderState.timestamp * 0.045) * 1.4;
  } else if (isRestless) {
    jitterX = Math.sin(renderState.timestamp * 0.02) * 0.8;
    jitterY = Math.cos(renderState.timestamp * 0.025) * 0.6;
  }

  const headR   = 14;
  const bodyW   = b.w * 0.50;
  const bodyH   = b.h * 0.22 + breathOffset; // Chest expansion
  const headX   = b.x + b.w - 40 + headOffX + jitterX;
  const friendY = b.y + b.h * 0.36 - sitUpProgress * 8 + headOffY + bodyOffY + jitterY;

  // ── 1. Under-body shadow ─────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur    = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle     = 'rgba(0,0,0,0.01)';
  ctx.fillRect(headX - bodyW - 10, friendY - bodyH / 2 - 4, bodyW + headR * 2 + 10, bodyH + 8);
  ctx.restore();

  // ── 2. Body under covers ─────────────────────────────────────────────
  const bodyX = headX - bodyW;
  ctx.save();
  ctx.translate(bodyX + bodyW / 2, friendY);
  ctx.rotate(facingAngle);

  fillRoundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, bodyH, bodyH / 2, C.body);
  fillRoundRect(ctx, -bodyW / 2 + 10, -bodyH / 2 + 3, bodyW - 20, bodyH - 6, bodyH / 4, C.bodyDark);

  // Blanket edge / shoulder
  ctx.fillStyle = 'rgba(30,47,66,0.6)';
  ctx.beginPath();
  ctx.ellipse(bodyW / 2 - 14, 0, 22, bodyH / 2 + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── 3. Head ──────────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor   = isAwake ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0,0,0,0.6)';
  ctx.shadowBlur    = isAwake ? 14 : 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle     = C.head;
  ctx.beginPath();
  ctx.ellipse(headX, friendY, headR, headR * 0.88, isAwake ? -0.1 : facingAngle * 0.5, 0, Math.PI * 2);
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

  // ── 4. Eyes & Facial Expression ──────────────────────────────────────
  const eyesOpenAmount = ai?.eyesOpenAmount ?? (isAwake ? 1 : 0);
  drawDynamicEyes(ctx, headX, friendY, eyesOpenAmount, isRestless || isAlmostAwake, isAwake);

  // Mouth & Sweat
  if (isAwake) {
    // Shocked open mouth
    ctx.fillStyle = '#451a1a';
    ctx.beginPath();
    ctx.ellipse(headX - 2, friendY + 5, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (isAlmostAwake || isRestless) {
    ctx.strokeStyle = '#6e4533';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(headX - 3, friendY + 5);
    ctx.lineTo(headX + 3, friendY + (isAlmostAwake ? 4 : 5));
    ctx.stroke();
    drawSweat(ctx, headX + 6, friendY - 6);
  } else {
    // Peaceful curved mouth
    ctx.beginPath();
    ctx.arc(headX, friendY + 5, 3, Math.PI * 0.1, Math.PI * 0.9, false);
    ctx.strokeStyle = '#8a6a54';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── 5. Indicators, Mumble Bubble & Snore Puff ─────────────────────────
  if (isAwake) {
    drawAlertIcon(ctx, headX, friendY - 24, renderState.timestamp);
  } else {
    // Zzz animation
    drawZzz(ctx, headX, friendY, renderState.timestamp, friendState);

    // Question mark indicator when almost awake / peeking
    if (ai && ai.questionMarkAlpha > 0.05) {
      drawQuestionMark(ctx, headX + 4, friendY - 22, ai.questionMarkAlpha);
    }

    // Mumble Speech Bubble
    if (ai && ai.mumbleText && ai.mumbleAlpha > 0.05) {
      drawMumbleBubble(ctx, headX - 10, friendY - 26, ai.mumbleText, ai.mumbleAlpha);
    }

    // Snore Puff Animation
    if (ai && ai.snorePuff) {
      drawSnorePuff(ctx, headX - 8, friendY - 4, ai.snorePuff.progress);
    }
  }
}

// ── Dynamic Eyes (interpolates between closed slit, peek, and awake) ───────────

function drawDynamicEyes(
  ctx: Ctx,
  hx: number,
  hy: number,
  openAmount: number,
  isRestless: boolean,
  isAwake: boolean,
): void {
  if (openAmount > 0.2 || isAwake) {
    const eyeH = 1 + openAmount * 3.5;
    const eyeW = 3.2;

    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(hx - 5, hy + 1, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.ellipse(hx + 4, hy + 1, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(hx - 6 + (isAwake ? 0 : 0.5), hy + 1, Math.min(1.8, eyeH * 0.6), 0, Math.PI * 2);
    ctx.arc(hx + 3 + (isAwake ? 0 : 0.5), hy + 1, Math.min(1.8, eyeH * 0.6), 0, Math.PI * 2);
    ctx.fill();

    // Brows
    ctx.strokeStyle = isAwake ? '#2d1810' : '#5a3d2c';
    ctx.lineWidth = isAwake ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy - 4);
    ctx.lineTo(hx - 2, hy - (isAwake ? 5 : 3));
    ctx.moveTo(hx + 1, hy - (isAwake ? 5 : 3));
    ctx.lineTo(hx + 7, hy - 4);
    ctx.stroke();
  } else if (isRestless) {
    // Tense closed eyes
    ctx.strokeStyle = '#5a3d2c';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy + 1);
    ctx.lineTo(hx - 2, hy + 2);
    ctx.moveTo(hx + 1, hy + 2);
    ctx.lineTo(hx + 7, hy + 1);
    ctx.stroke();
  } else {
    // Calm closed curved eyes
    ctx.strokeStyle = '#7a5a44';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(hx - 5, hy + 1, 3.5, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx + 4, hy + 1, 3.5, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.stroke();
  }
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

function drawQuestionMark(ctx: Ctx, x: number, y: number, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 15px "Space Mono", monospace';
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
  ctx.shadowBlur = 8;
  ctx.textAlign = 'center';
  ctx.fillText('?', x, y);
  ctx.restore();
}

function drawMumbleBubble(ctx: Ctx, x: number, y: number, text: string, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'italic 10px "Inter", system-ui, sans-serif';

  const textWidth = ctx.measureText(text).width;
  const padX = 6;
  const padY = 3;
  const boxW = textWidth + padX * 2;
  const boxH = 16;
  const boxX = x - boxW / 2;
  const boxY = y - boxH / 2;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 6;
  fillRoundRect(ctx, boxX, boxY, boxW, boxH, 4, 'rgba(15, 23, 42, 0.85)');

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawSnorePuff(ctx: Ctx, x: number, y: number, progress: number): void {
  const alpha = 1 - progress;
  const radius = 2 + progress * 6;
  const puffY = y - progress * 10;

  ctx.save();
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = 'rgba(203, 213, 225, 0.5)';
  ctx.beginPath();
  ctx.arc(x, puffY, radius, 0, Math.PI * 2);
  ctx.fill();
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
