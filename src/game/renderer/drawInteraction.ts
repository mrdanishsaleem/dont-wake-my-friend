/**
 * drawInteraction — renders interaction prompts, beacons, and visual feedback effects.
 */

import type { RenderState } from '../../types';
import { fillRoundRect } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

export function drawInteraction(ctx: Ctx, state: RenderState): void {
  const { timestamp, player, nearbyInteractable, interactionEffects } = state;

  // 1. Draw nearby interactable beacon & prompt
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

  // 2. Draw active interaction effects (ripples, floating text)
  if (interactionEffects && interactionEffects.length > 0) {
    for (const effect of interactionEffects) {
      drawEffect(ctx, effect, timestamp);
    }
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

  // Floating bob animation
  const bob = Math.sin(timestamp * 0.006) * 2;
  const py = y + bob;

  ctx.font = 'bold 11px "Space Mono", monospace';
  const textWidth = ctx.measureText(text).width;
  const padX = 8;
  const padY = 4;
  const boxW = textWidth + padX * 2 + 18; // Extra space for [E] badge
  const boxH = 22;
  const boxX = x - boxW / 2;
  const boxY = py - boxH / 2;

  // Prompt background bubble
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  fillRoundRect(ctx, boxX, boxY, boxW, boxH, 4, '#111827');

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.stroke();

  // [E] Key badge inside bubble
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

  // Prompt message text
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
  const ringRadius = 10 + progress * 40;
  ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.8})`;
  ctx.lineWidth = 2 * (1 - progress);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Floating text rising upward
  if (effect.text) {
    const floatY = effect.y - 12 - progress * 32;
    ctx.font = 'bold 12px "Space Mono", monospace';
    ctx.fillStyle = `rgba(248, 113, 113, ${alpha})`;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText(effect.text, effect.x, floatY);
  }

  ctx.restore();
}
