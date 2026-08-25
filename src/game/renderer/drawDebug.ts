/**
 * drawDebug — renders collision boxes and debug overlays when enabled.
 */

import type { Room, PlayerState } from '../../types';

type Ctx = CanvasRenderingContext2D;

export function drawDebugCollision(
  ctx: Ctx,
  room: Room,
  player: PlayerState,
): void {
  ctx.save();

  // 1. Draw solid obstacle bounding boxes
  ctx.lineWidth = 1.5;
  for (const obj of room.objects) {
    const { x, y, w, h } = obj.bounds;
    if (obj.solid) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Red translucent
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#ef4444'; // Red outline
      ctx.strokeRect(x, y, w, h);

      // Label
      ctx.font = '9px monospace';
      ctx.fillStyle = '#fca5a5';
      ctx.fillText(`${obj.id}`, x + 4, y + 12);
    } else {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Blue translucent for non-solid/triggers
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.strokeRect(x, y, w, h);
    }
  }

  // 2. Draw player collision bounding box
  ctx.fillStyle = 'rgba(34, 197, 94, 0.25)'; // Green translucent
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.strokeStyle = '#22c55e'; // Green outline
  ctx.strokeRect(player.x, player.y, player.w, player.h);

  ctx.restore();
}
