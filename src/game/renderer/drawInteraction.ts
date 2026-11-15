/**
 * drawInteraction — renders interaction prompts, thrown coins, and noise indicators.
 */

import type { DistractionThrow, RenderState } from '../../types';
import { CANVAS_WIDTH } from '../../types';
import { fillRoundRect } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

export function drawInteraction(ctx: Ctx, state: RenderState): void {
  const { timestamp, nearbyInteractable, interactionEffects } = state;

  // Nearby interactable beacon & prompt
  if (nearbyInteractable) {
    drawInteractableBeacon(ctx, nearbyInteractable.x, nearbyInteractable.y, timestamp);
    drawInteractionPrompt(
      ctx,
      nearbyInteractable.x,
      nearbyInteractable.y - 28,
      nearbyInteractable.promptText || 'Interact',
      timestamp,
    );
  }

  if (state.distraction) drawThrownCoin(ctx, state.distraction);

  // Active interaction & noise visual effects (ripples, floating noise labels)
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
  ctx.strokeStyle = 'rgba(228, 189, 136, 0.68)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle inner glow
  ctx.fillStyle = 'rgba(228, 189, 136, 0.08)';
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

  ctx.font = '600 13px "Inter", system-ui, sans-serif';
  const textWidth = ctx.measureText(text).width;
  const padX = 8;
  const boxW = textWidth + padX * 2 + 26;
  const boxH = 28;
  const boxX = Math.max(6, Math.min(x - boxW / 2, CANVAS_WIDTH - boxW - 6));
  const boxY = py - boxH / 2;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  fillRoundRect(ctx, boxX, boxY, boxW, boxH, 6, '#191d1d');

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#686052';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  ctx.stroke();

  // [E] Key badge
  const badgeW = 18;
  const badgeH = 18;
  const badgeX = boxX + padX;
  const badgeY = boxY + (boxH - badgeH) / 2;

  fillRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 2, '#332c24');
  ctx.strokeStyle = '#e4bd88';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2);
  ctx.stroke();

  ctx.fillStyle = '#e4bd88';
  ctx.font = 'bold 9px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 13px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, badgeX + badgeW + 6, py);

  ctx.restore();
}

function drawThrownCoin(ctx: Ctx, { origin, landing, elapsed, duration }: DistractionThrow): void {
  const progress = Math.min(1, elapsed / duration);
  const arc = Math.sin(progress * Math.PI);
  const x = origin.x + (landing.x - origin.x) * progress;
  const y = origin.y + (landing.y - origin.y) * progress;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${0.48 - arc * 0.28})`;
  ctx.beginPath();
  ctx.ellipse(x, y, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y - (1 - progress) * 14 - arc * 21);
  ctx.rotate(progress * Math.PI * 0.8);
  ctx.scale(1, 0.23 + Math.abs(Math.cos(progress * Math.PI * 5)) * 0.77);
  const metal = ctx.createLinearGradient(-5, -4, 5, 4);
  metal.addColorStop(0, '#fff1bf');
  metal.addColorStop(0.42, '#c6a36b');
  metal.addColorStop(1, '#725339');
  ctx.fillStyle = metal;
  ctx.strokeStyle = '#62472d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#eed29d';
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.stroke();
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
    ctx.fillText(effect.text, effect.x, floatY);
  }

  ctx.restore();
}
