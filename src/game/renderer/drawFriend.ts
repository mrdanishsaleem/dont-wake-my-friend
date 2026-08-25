/**
 * drawFriend — renders the sleeping friend on the bed with a Zzz animation.
 *
 * The friend is drawn as a simple top-down silhouette lying horizontally
 * on the bed. Three "Z" glyphs float upward and fade out cyclically.
 *
 * No AI or wake state in Part 2 — purely visual.
 */

import type { Room, RenderState } from '../../types';
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
  zzz:        'rgba(180,210,255,',  // prefix — alpha added dynamically
};

// ZZZ config
const ZZZ_COUNT  = 3;
const ZZZ_CYCLE  = 3200;  // ms for a full cycle of all Zs

export function drawFriend(ctx: Ctx, room: Room, state: RenderState): void {
  // Locate the bed bounds from room data
  const bed = room.objects.find((o) => o.id === 'bed-main');
  if (!bed) return;

  const b = bed.bounds;

  // The friend lies horizontally — occupying most of the bed length,
  // positioned toward the headboard (right side) with the head on the pillow.
  //
  //  ← leftward (foot) ─────────────── rightward (head) →
  //
  // friendX/Y is the head position (near headboard on right)
  const headR  = 14;                        // head radius
  const bodyW  = b.w * 0.50;               // body length (feet to neck)
  const bodyH  = b.h * 0.22;               // body width (shoulder span)

  const headX  = b.x + b.w - 40;           // head near right (headboard) wall
  const friendY = b.y + b.h * 0.36;        // vertical centre on bed

  // Under-body shadow
  ctx.save();
  ctx.shadowColor  = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur   = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle    = 'rgba(0,0,0,0.01)';
  ctx.fillRect(headX - bodyW - 10, friendY - bodyH / 2 - 4, bodyW + headR * 2 + 10, bodyH + 8);
  ctx.restore();

  // Body under covers (bump silhouette)
  const bodyX = headX - bodyW;
  fillRoundRect(ctx, bodyX, friendY - bodyH / 2, bodyW, bodyH, bodyH / 2, C.body);
  // Darker centre of body
  fillRoundRect(ctx, bodyX + 10, friendY - bodyH / 2 + 3, bodyW - 20, bodyH - 6, bodyH / 4, C.bodyDark);

  // Visible shoulder/blanket edge
  ctx.fillStyle = 'rgba(30,47,66,0.6)';
  ctx.beginPath();
  ctx.ellipse(headX - 14, friendY, 22, bodyH / 2 + 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.save();
  // Head shadow
  ctx.shadowColor  = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur   = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle    = C.head;
  ctx.beginPath();
  ctx.ellipse(headX, friendY, headR, headR * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cheek shadow (face turned slightly downward)
  ctx.fillStyle = C.headShadow;
  ctx.beginPath();
  ctx.ellipse(headX - 2, friendY + 4, headR * 0.6, headR * 0.45, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Hair (top of head — dark cap)
  ctx.fillStyle = C.hair;
  ctx.beginPath();
  ctx.ellipse(headX + 2, friendY - headR * 0.5, headR * 0.85, headR * 0.55, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Closed eyes (two short curves)
  ctx.strokeStyle = '#7a5a44';
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';

  // Left eye (from our perspective, right on screen since lying down)
  ctx.beginPath();
  ctx.arc(headX - 5, friendY + 1, 3.5, Math.PI * 1.1, Math.PI * 1.9, false);
  ctx.stroke();

  // Right eye
  ctx.beginPath();
  ctx.arc(headX + 4, friendY + 1, 3.5, Math.PI * 1.1, Math.PI * 1.9, false);
  ctx.stroke();

  // Sleeping mouth (small curved line)
  ctx.beginPath();
  ctx.arc(headX, friendY + 5, 3, Math.PI * 0.1, Math.PI * 0.9, false);
  ctx.strokeStyle = '#8a6a54';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Zzz animation ──────────────────────────────────────────────────
  drawZzz(ctx, headX, friendY, state.timestamp);
}

function drawZzz(ctx: Ctx, headX: number, headY: number, timestamp: number): void {
  const t = (timestamp % ZZZ_CYCLE) / ZZZ_CYCLE;   // 0 → 1 over one cycle

  for (let i = 0; i < ZZZ_COUNT; i++) {
    // Each Z is offset in phase and rises independently
    const phase = (t + i / ZZZ_COUNT) % 1;          // 0 → 1, staggered

    if (phase < 0.08) continue;                      // brief pause at start of cycle

    // Rise from near head to ~50px above, fade in then out
    const riseT  = (phase - 0.08) / 0.92;
    const alpha  = riseT < 0.3
      ? riseT / 0.3                                  // fade in
      : riseT > 0.7
        ? (1 - riseT) / 0.3                          // fade out
        : 1;                                         // fully visible

    const yOffset = -30 - riseT * 50;
    const xOffset =  14 + i * 6 + riseT * 8;
    const size    = 8 + i * 2.5;

    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.font        = `bold ${size}px 'Space Mono', monospace`;
    ctx.fillStyle   = `${C.zzz}1)`;
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'alphabetic';

    // Subtle glow
    ctx.shadowColor = 'rgba(160,200,255,0.4)';
    ctx.shadowBlur  = 6;

    ctx.fillText('Z', headX + xOffset, headY + yOffset);
    ctx.restore();
  }
}
