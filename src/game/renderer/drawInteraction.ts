/**
 * drawInteraction — renders interaction prompts, beacons, noise indicators, and proximity hazard warnings.
 */

import type { RenderState, Vec2 } from '../../types';
import { fillRoundRect } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

export function drawInteraction(ctx: Ctx, state: RenderState, friendPos?: Vec2): void {
  const { timestamp, player, nearbyInteractable, interactionEffects } = state;

  // 1. Proximity hazard warning near sleeping friend
  if (friendPos) {
    drawProximityHazard(ctx, player, friendPos, timestamp);
  }

  // 2. Nearby interactable beacon & prompt
  if (nearbyInteractable) {
    drawInteractableBeacon(ctx, nearbyInteractable.x, nearbyInteractable.y, timestamp);
    drawInteractionPrompt(
      ctx,
      nearbyInteractable.x,
      nearbyInteractable.y - 28,
      nearbyInteractable.promptText || 'Press E to interact',
      timestamp,
    );
  }

  // 3. Active interaction & noise visual effects (ripples, floating noise labels)
  if (interactionEffects && interactionEffects.length > 0) {
    for (const effect of interactionEffects) {
      drawEffect(ctx, effect, timestamp);
    }
  }
}

function drawProximityHazard(ctx: Ctx, player: RenderState['player'], friendPos: Vec2, timestamp: number): void {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const dist = Math.hypot(px - friendPos.x, py - friendPos.y);

  if (dist < 230) {
    const isVeryClose = dist < 140;
    const pulse = 1 + Math.sin(timestamp * 0.008) * 0.08;
    const alpha = Math.min(0.8, (230 - dist) / 140);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Subtle dashed danger arc around bed
    ctx.strokeStyle = isVeryClose ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(friendPos.x, friendPos.y, 140 * pulse, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    // Floating hazard badge above player
    if (isVeryClose) {
      ctx.setLineDash([]);
      ctx.font = 'bold 9px "Space Mono", monospace';
      ctx.fillStyle = '#f87171';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ 2x NOISE ZONE', px, player.y - 12);
    }

    ctx.restore();
  }
}

function drawInteractableBeacon(ctx: Ctx, x: number, y: number, timestamp: number): void {
  const pulse = 1 + Math.sin(timestamp * 0.008) * 0.2;
  const radius = 16 * pulse;

  ctx.save();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle inner glow
  ctx.fillStyle = 'rgba(125, 211, 252, 0.12)';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawInteractionPrompt(
  ctx: Ctx,
  x: number,
  y: number,
  text: string,
  timestamp: number,
): void {
  ctx.save();

  const bob = Math.sin(timestamp * 0.006) * 2;
  const py = y + bob;

  ctx.font = 'bold 11px "Space Mono", monospace';
  const textWidth = ctx.measureText(text).width;
  const padX = 8;
  const boxW = textWidth + padX * 2 + 18;
  const boxH = 22;
  const boxX = x - boxW / 2;
  const boxY = py - boxH / 2;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  fillRoundRect(ctx, boxX, boxY, boxW, boxH, 4, '#111827');

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.stroke();

  // [E] Key badge
  const badgeW = 14;
  const badgeH = 14;
  const badgeX = boxX + padX;
  const badgeY = boxY + (boxH - badgeH) / 2;

  fillRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 2, '#1e293b');
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2);
  ctx.stroke();

  ctx.fillStyle = '#7dd3fc';
  ctx.font = 'bold 9px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '500 11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, badgeX + badgeW + 6, py);

  ctx.restore();
}

function drawEffect(
  ctx: Ctx,
  effect: { x: number; y: number; startTime: number; duration: number; text?: string },
  timestamp: number,
): void {
  const elapsed = timestamp - effect.startTime;
  const progress = Math.min(1, elapsed / effect.duration);
  const alpha = 1 - progress;

  ctx.save();

  // Expanding ripple ring
  const ringRadius = 10 + progress * 46;
  ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.85})`;
  ctx.lineWidth = 2.5 * (1 - progress);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Floating noise icon & text rising upward
  if (effect.text) {
    const floatY = effect.y - 14 - progress * 34;
    ctx.font = 'bold 12px "Space Mono", monospace';
    ctx.fillStyle = `rgba(248, 113, 113, ${alpha})`;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(`🔊 ${effect.text}`, effect.x, floatY);
  }

  ctx.restore();
}
