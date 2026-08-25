/**
 * drawFurniture — renders all bedroom furniture and decorative objects.
 *
 *  - Bed (frame, headboard, footboard, pillow, duvet)
 *  - Nightstand / bedside table
 *  - Desk with monitor/books
 *  - Chair
 *  - Bookshelf
 *  - Rug
 *  - Plant decoration
 */

import type { Room, Rect } from '../../types';
import { box, dropShadow, vertGradFill, fillRoundRect } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  // Bed
  bedFrame:     '#1c1630',
  bedFrameEdge: '#2b2045',
  headboard:    '#231940',
  headboardHi:  '#2e2250',
  footboard:    '#1e1836',
  pillow:       '#2e4060',
  pillowHi:     '#3a5070',
  duvet:        '#1e2f42',
  duvetFold:    '#25384f',
  duvetHi:      '#273f55',

  // Nightstand
  nsBody:       '#1c1630',
  nsEdge:       '#281e44',
  nsDrawer:     '#221840',
  nsLampBase:   '#141020',
  nsLampShade:  '#1a1830',
  nsLampRim:    '#2a2848',

  // Desk
  deskTop:      '#1a1628',
  deskEdge:     '#252038',
  deskLeg:      '#14101e',
  deskItem:     '#1e1c30',  // monitor / items
  monitorScreen:'#0d1824',
  monitorEdge:  '#1a2030',
  monitorGlow:  'rgba(80,140,200,0.06)',

  // Chair
  chairSeat:    '#201c34',
  chairBack:    '#1a182e',
  chairEdge:    '#2e2a48',
  chairLeg:     '#14101e',

  // Bookshelf
  shelfBody:    '#181428',
  shelfEdge:    '#241e3a',
  book1:        '#1e3048',
  book2:        '#2a1e3e',
  book3:        '#1e2a3c',
  book4:        '#2e2040',

  // Rug
  rugBase:      '#16212e',
  rugBorder:    '#1d2e42',
  rugPattern:   '#1a2838',

  // Plant
  pot:          '#1e1830',
  potEdge:      '#2c2446',
  leaf:         '#1a2e22',
  leafHi:       '#22382a',

  // Water glass
  glass:        'rgba(160,200,240,0.18)',
  glassEdge:    'rgba(160,200,240,0.35)',
  water:        'rgba(100,160,220,0.22)',
};

// ─────────────────────────────────────────────────────────────────────────────

export function drawFurniture(ctx: Ctx, room: Room): void {
  for (const obj of room.objects) {
    const b = obj.bounds;
    switch (obj.kind) {
      case 'rug':         drawRug(ctx, b);      break;
      case 'bed':         drawBed(ctx, b);       break;
      case 'nightstand':  drawNightstand(ctx, b); break;
      case 'desk':        drawDesk(ctx, b);      break;
      case 'chair':       drawChair(ctx, b);     break;
      case 'bookshelf':   drawBookshelf(ctx, b);  break;
      case 'decor':
        if (obj.meta?.type === 'plant') drawPlant(ctx, b);
        if (obj.meta?.type === 'glass') drawGlass(ctx, b);
        break;
    }
  }
}

// ── Rug ───────────────────────────────────────────────────────────────────────

function drawRug(ctx: Ctx, b: Rect): void {
  // Shadow beneath
  dropShadow(ctx, b.x, b.y, b.w, b.h, 4, 10, 'rgba(0,0,0,0.3)');

  fillRoundRect(ctx, b.x, b.y, b.w, b.h, 6, C.rugBase);

  // Border stripe
  ctx.strokeStyle = C.rugBorder;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(b.x + 8, b.y + 8, b.w - 16, b.h - 16, 4);
  ctx.stroke();

  // Inner border stripe
  ctx.strokeStyle = C.rugPattern;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(b.x + 18, b.y + 18, b.w - 36, b.h - 36, 2);
  ctx.stroke();

  // Subtle diamond pattern at center
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  ctx.strokeStyle = C.rugBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx,          cy - 24);
  ctx.lineTo(cx + 20,     cy);
  ctx.lineTo(cx,          cy + 24);
  ctx.lineTo(cx - 20,     cy);
  ctx.closePath();
  ctx.stroke();
}

// ── Bed ───────────────────────────────────────────────────────────────────────

function drawBed(ctx: Ctx, b: Rect): void {
  dropShadow(ctx, b.x, b.y + b.h * 0.8, b.w, b.h * 0.2, 8, 18, 'rgba(0,0,0,0.5)');

  // Bed frame
  box(ctx, b.x, b.y, b.w, b.h, C.bedFrame, C.bedFrameEdge, 2);

  // Headboard (right side — bed is against right wall)
  const hbW = 22;
  box(ctx, b.x + b.w - hbW, b.y, hbW, b.h, C.headboard, C.headboardHi, 1.5, 3);

  // Headboard raised centre panel
  fillRoundRect(
    ctx,
    b.x + b.w - hbW + 4,
    b.y + b.h * 0.15,
    hbW - 8,
    b.h * 0.7,
    2,
    C.headboardHi,
  );

  // Footboard (left side)
  const fbW = 14;
  box(ctx, b.x, b.y + b.h * 0.1, fbW, b.h * 0.8, C.footboard, C.bedFrameEdge, 1.5, 2);

  // Duvet
  const duvetX = b.x + fbW + 4;
  const duvetW = b.w - hbW - fbW - 8;
  vertGradFill(
    ctx,
    duvetX, b.y + b.h * 0.08,
    duvetW, b.h * 0.86,
    C.duvetHi,
    C.duvet,
  );

  // Duvet fold at top
  box(ctx, duvetX, b.y + b.h * 0.08, duvetW, b.h * 0.1, C.duvetFold, C.duvetHi, 1);

  // Pillow
  const pilX = duvetX + 8;
  const pilW = duvetW * 0.42;
  const pilY = b.y + b.h * 0.12;
  const pilH = b.h * 0.18;
  fillRoundRect(ctx, pilX, pilY, pilW, pilH, 5, C.pillow);
  // pillow highlight
  fillRoundRect(ctx, pilX + 4, pilY + 3, pilW - 8, pilH * 0.35, 3, C.pillowHi);

  // Duvet texture — subtle horizontal lines
  ctx.strokeStyle = 'rgba(35,60,80,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const ly = b.y + b.h * 0.08 + (b.h * 0.86 / 6) * i;
    ctx.beginPath();
    ctx.moveTo(duvetX + 4, ly);
    ctx.lineTo(duvetX + duvetW - 4, ly);
    ctx.stroke();
  }
}

// ── Nightstand ────────────────────────────────────────────────────────────────

function drawNightstand(ctx: Ctx, b: Rect): void {
  dropShadow(ctx, b.x, b.y, b.w, b.h, 4, 8, 'rgba(0,0,0,0.4)');

  box(ctx, b.x, b.y, b.w, b.h, C.nsBody, C.nsEdge, 1.5, 2);

  // Drawer line
  ctx.strokeStyle = C.nsDrawer;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x + 6, b.y + b.h * 0.5);
  ctx.lineTo(b.x + b.w - 6, b.y + b.h * 0.5);
  ctx.stroke();

  // Drawer handle
  ctx.fillStyle = C.nsEdge;
  ctx.beginPath();
  ctx.roundRect(b.x + b.w * 0.35, b.y + b.h * 0.58, b.w * 0.3, 4, 2);
  ctx.fill();

  // Lamp stem
  ctx.fillStyle = C.nsLampBase;
  ctx.fillRect(b.x + b.w * 0.42, b.y - 16, 6, 16);

  // Lamp shade
  ctx.fillStyle = C.nsLampShade;
  ctx.beginPath();
  ctx.moveTo(b.x + b.w * 0.15,  b.y - 16);
  ctx.lineTo(b.x + b.w * 0.85,  b.y - 16);
  ctx.lineTo(b.x + b.w * 0.72,  b.y - 36);
  ctx.lineTo(b.x + b.w * 0.28,  b.y - 36);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.nsLampRim;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Desk ──────────────────────────────────────────────────────────────────────

function drawDesk(ctx: Ctx, b: Rect): void {
  dropShadow(ctx, b.x, b.y, b.w, b.h, 5, 10, 'rgba(0,0,0,0.45)');

  // Desk legs (draw behind top surface)
  const legW = 8;
  const legH = 20;
  ctx.fillStyle = C.deskLeg;
  // Left leg
  ctx.fillRect(b.x + 6,          b.y + b.h - legH, legW, legH);
  // Right leg
  ctx.fillRect(b.x + b.w - 6 - legW, b.y + b.h - legH, legW, legH);

  // Desk top surface
  box(ctx, b.x, b.y, b.w, b.h, C.deskTop, C.deskEdge, 1.5, 2);

  // Surface sheen (subtle highlight on top edge)
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);

  // Monitor (sitting on desk)
  const monW = 72;
  const monH = 48;
  const monX = b.x + b.w * 0.5 - monW / 2;
  const monY = b.y - monH - 4;

  // Monitor stand
  ctx.fillStyle = C.deskLeg;
  ctx.fillRect(monX + monW * 0.38, b.y - 6, monW * 0.24, 6);

  // Monitor bezel
  box(ctx, monX, monY, monW, monH, C.monitorEdge, '#1e2840', 1.5, 3);

  // Screen
  fillRoundRect(ctx, monX + 4, monY + 4, monW - 8, monH - 8, 2, C.monitorScreen);

  // Sleeping screen glow (very dim)
  const screenGrad = ctx.createLinearGradient(monX + 4, monY + 4, monX + 4, monY + monH);
  screenGrad.addColorStop(0, 'rgba(60,110,180,0.07)');
  screenGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = screenGrad;
  ctx.fillRect(monX + 4, monY + 4, monW - 8, monH - 8);

  // Small book stack on desk (left side)
  const bkX = b.x + 8;
  const bkY = b.y - 4;
  drawBookStack(ctx, bkX, bkY, 32, 14);
}

function drawBookStack(ctx: Ctx, x: number, y: number, w: number, spacing: number): void {
  const books = [C.book1, C.book2, C.book3];
  books.forEach((color, i) => {
    box(ctx, x, y - i * spacing, w, spacing - 1, color, C.shelfEdge, 0.5, 1);
  });
}

// ── Chair ─────────────────────────────────────────────────────────────────────

function drawChair(ctx: Ctx, b: Rect): void {
  dropShadow(ctx, b.x, b.y, b.w, b.h, 3, 8, 'rgba(0,0,0,0.4)');

  // Chair legs
  ctx.fillStyle = C.chairLeg;
  const legPositions = [
    [b.x + 4,          b.y + b.h - 10],
    [b.x + b.w - 12,   b.y + b.h - 10],
    [b.x + 4,          b.y + b.h * 0.5],
    [b.x + b.w - 12,   b.y + b.h * 0.5],
  ] as const;
  for (const [lx, ly] of legPositions) {
    ctx.fillRect(lx, ly, 8, 12);
  }

  // Seat
  fillRoundRect(ctx, b.x, b.y + b.h * 0.4, b.w, b.h * 0.6, 4, C.chairSeat);
  ctx.strokeStyle = C.chairEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(b.x, b.y + b.h * 0.4, b.w, b.h * 0.6, 4);
  ctx.stroke();

  // Seat cushion highlight
  fillRoundRect(ctx, b.x + 4, b.y + b.h * 0.42, b.w - 8, b.h * 0.12, 3, 'rgba(60,55,90,0.5)');

  // Chair back
  fillRoundRect(ctx, b.x + 6, b.y, b.w - 12, b.h * 0.44, 3, C.chairBack);
  ctx.strokeStyle = C.chairEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(b.x + 6, b.y, b.w - 12, b.h * 0.44, 3);
  ctx.stroke();

  // Backrest slat lines
  ctx.strokeStyle = 'rgba(50,45,75,0.6)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    const slatY = b.y + (b.h * 0.44 / 3) * i;
    ctx.beginPath();
    ctx.moveTo(b.x + 10, slatY);
    ctx.lineTo(b.x + b.w - 10, slatY);
    ctx.stroke();
  }
}

// ── Bookshelf ─────────────────────────────────────────────────────────────────

function drawBookshelf(ctx: Ctx, b: Rect): void {
  dropShadow(ctx, b.x, b.y, b.w, b.h, 3, 8, 'rgba(0,0,0,0.4)');

  box(ctx, b.x, b.y, b.w, b.h, C.shelfBody, C.shelfEdge, 1.5, 2);

  // Shelf divider line
  ctx.strokeStyle = C.shelfEdge;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x + 6, b.y + b.h * 0.5);
  ctx.lineTo(b.x + b.w - 6, b.y + b.h * 0.5);
  ctx.stroke();

  // Books packed in
  const bookColors = [C.book1, C.book2, C.book3, C.book4, C.book1, C.book3];
  const bookW = (b.w - 12) / bookColors.length;
  bookColors.forEach((color, i) => {
    const bx = b.x + 6 + i * bookW;
    const by = b.y + 4;
    const bh = b.h * 0.42;
    box(ctx, bx, by, bookW - 2, bh, color, C.shelfEdge, 0.5);
  });

  // Bottom row — shorter books
  const short = [C.book2, C.book4, C.book1, C.book3, C.book2];
  const sW = (b.w - 12) / short.length;
  short.forEach((color, i) => {
    const bx = b.x + 6 + i * sW;
    const by = b.y + b.h * 0.55;
    const bh = b.h * 0.36;
    box(ctx, bx, by, sW - 2, bh, color, C.shelfEdge, 0.5);
  });
}

// ── Plant decoration ──────────────────────────────────────────────────────────

function drawPlant(ctx: Ctx, b: Rect): void {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;

  // Pot
  ctx.fillStyle = C.pot;
  ctx.beginPath();
  ctx.moveTo(b.x + 4,       b.y + b.h * 0.55);
  ctx.lineTo(b.x + b.w - 4, b.y + b.h * 0.55);
  ctx.lineTo(b.x + b.w - 2, b.y + b.h);
  ctx.lineTo(b.x + 2,       b.y + b.h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = C.potEdge;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pot rim
  fillRoundRect(ctx, b.x + 2, b.y + b.h * 0.52, b.w - 4, 5, 2, C.potEdge);

  // Leaves (three overlapping ellipses)
  const leafPositions = [
    { dx: 0,  dy: -4, rx: 7, ry: 11, angle: 0 },
    { dx: -6, dy: 2,  rx: 6, ry: 10, angle: -0.5 },
    { dx:  6, dy: 2,  rx: 6, ry: 10, angle:  0.5 },
  ];
  for (const lp of leafPositions) {
    ctx.save();
    ctx.translate(cx + lp.dx, cy + lp.dy - 4);
    ctx.rotate(lp.angle);
    ctx.fillStyle = C.leaf;
    ctx.beginPath();
    ctx.ellipse(0, 0, lp.rx, lp.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Leaf vein highlight
    ctx.strokeStyle = C.leafHi;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -lp.ry * 0.8);
    ctx.lineTo(0, lp.ry * 0.8);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Water glass ───────────────────────────────────────────────────────────────

function drawGlass(ctx: Ctx, b: Rect): void {
  // Glass body (trapezoid)
  ctx.fillStyle = C.glass;
  ctx.beginPath();
  ctx.moveTo(b.x + 2,       b.y);
  ctx.lineTo(b.x + b.w - 2, b.y);
  ctx.lineTo(b.x + b.w,     b.y + b.h);
  ctx.lineTo(b.x,            b.y + b.h);
  ctx.closePath();
  ctx.fill();

  // Rim
  ctx.strokeStyle = C.glassEdge;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Water level fill
  const waterY = b.y + b.h * 0.35;
  ctx.fillStyle = C.water;
  ctx.beginPath();
  ctx.moveTo(b.x + 2,       waterY);
  ctx.lineTo(b.x + b.w - 2, waterY);
  ctx.lineTo(b.x + b.w,     b.y + b.h);
  ctx.lineTo(b.x,            b.y + b.h);
  ctx.closePath();
  ctx.fill();

  // Glass highlight line
  ctx.strokeStyle = 'rgba(180,220,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x + 3, b.y + 2);
  ctx.lineTo(b.x + 3, b.y + b.h - 2);
  ctx.stroke();
}
