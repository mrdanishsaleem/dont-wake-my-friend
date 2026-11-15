import type { Room } from '../../types';
import { box } from './drawPrimitives';

type Ctx = CanvasRenderingContext2D;

const C = {
  baseboard: '#393734',
  baseboardEdge: '#55514b',
  windowFill: '#0a1220',
  windowFrame: '#39434d',
  windowDiv: '#222c37',
  doorFill: '#43362d',
  doorFrame: '#221d1a',
  doorPanel: '#635044',
  doorKnob: '#8e7956',
  doorKnobHi: '#cec19e',
  wallCorner: '#171818',
};

const floorTextures = new WeakMap<Room, HTMLCanvasElement>();

// Seeded dust particles in the moonbeam
const DUST_PARTICLES = [
  { x: 380, y: 120, speed: 0.0008, size: 1.2, phase: 0 },
  { x: 410, y: 220, speed: 0.0006, size: 1.5, phase: 2 },
  { x: 350, y: 310, speed: 0.0009, size: 1.0, phase: 4 },
  { x: 440, y: 180, speed: 0.0007, size: 1.4, phase: 1.5 },
  { x: 390, y: 390, speed: 0.0005, size: 1.6, phase: 3.2 },
  { x: 460, y: 290, speed: 0.0008, size: 1.1, phase: 5.1 },
];

export function drawRoom(ctx: Ctx, room: Room, timestamp: number = 0): void {
  drawFloor(ctx, room);
  drawTrim(ctx, room.width, room.height);

  // Structural objects from data
  for (const obj of room.objects) {
    if (obj.kind === 'window') {
      drawWindow(ctx, obj.bounds.x, obj.bounds.y, obj.bounds.w, obj.bounds.h, room.height, timestamp);
    }
    if (obj.kind === 'door') {
      drawDoor(ctx, obj.bounds.x, obj.bounds.y, obj.bounds.w, obj.bounds.h);
    }
  }
}

function drawFloor(ctx: Ctx, room: Room): void {
  let texture = floorTextures.get(room);
  if (!texture) {
    texture = document.createElement('canvas');
    texture.width = room.width;
    texture.height = room.height;
    const surface = texture.getContext('2d');
    if (!surface) return;
    paintFloor(surface, room);
    floorTextures.set(room, texture);
  }
  ctx.drawImage(texture, 0, 0);
}

function paintFloor(ctx: Ctx, { width, height, floorType }: Room): void {
  let seed = 1439;
  function random(): number {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const isTile = floorType === 'tile';
  const isCarpet = floorType === 'carpet';
  const rowHeight = isTile ? 66 : 25;
  const boardWidth = isTile ? 66 : 150;
  ctx.fillStyle = isTile ? '#242a2a' : '#29231f';
  ctx.fillRect(0, 0, width, height);

  if (isCarpet) {
    ctx.fillStyle = '#353735';
    ctx.fillRect(0, 0, width, height);
  } else {
    for (let row = 0; row * rowHeight < height; row++) {
      const y = row * rowHeight;
      const stagger = isTile ? 0 : (row * 53) % boardWidth;
      for (let x = -stagger; x < width; x += boardWidth) {
        const shade = Math.floor(random() * 17);
        ctx.fillStyle = isTile
          ? `rgb(${63 + shade}, ${69 + shade}, ${69 + shade})`
          : `rgb(${64 + shade}, ${48 + shade}, ${40 + shade})`;
        ctx.fillRect(x + 1, y + 1, boardWidth - 1, rowHeight - 1);
        ctx.fillStyle = 'rgba(235, 221, 198, 0.1)';
        ctx.fillRect(x + 1, y + 1, boardWidth - 1, 1);
      }
    }
  }

  for (let i = 0; i < 17000; i++) {
    const x = random() * width;
    const y = random() * height;
    const length = !isTile && !isCarpet ? 2 + random() * 38 : 0.5 + random() * 2;
    ctx.fillStyle = i % 2 ? 'rgba(230, 220, 202, 0.07)' : 'rgba(12, 15, 18, 0.13)';
    ctx.fillRect(x, y, length, isCarpet ? 1.2 : 0.7);
  }
}

function drawTrim(ctx: Ctx, width: number, height: number): void {
  ctx.strokeStyle = C.baseboard;
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, width, height);
  ctx.strokeStyle = C.baseboardEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(2.5, 2.5, width - 5, height - 5);
}

export function drawRoomLighting(ctx: Ctx, room: Room): void {
  const { width, height } = room;
  const vignette = ctx.createRadialGradient(width * 0.52, height * 0.45, 95, width * 0.52, height * 0.45, width * 0.58);
  vignette.addColorStop(0, 'rgba(18, 28, 48, 0.04)');
  vignette.addColorStop(1, 'rgba(5, 9, 16, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const table = room.objects.find(({ kind }) => kind === 'nightstand');
  if (!table) return;
  const { x, y, w, h } = table.bounds;
  const lampX = x + w / 2;
  const lampY = y + h / 2;
  const light = ctx.createRadialGradient(lampX, lampY, 4, lampX, lampY, 92);
  light.addColorStop(0, 'rgba(248, 185, 108, 0.29)');
  light.addColorStop(0.35, 'rgba(248, 185, 108, 0.13)');
  light.addColorStop(1, 'rgba(248, 185, 108, 0)');
  ctx.fillStyle = light;
  ctx.fillRect(lampX - 92, lampY - 92, 184, 184);
}

// ── Window & Moonbeam ────────────────────────────────────────────────────────

function drawWindow(
  ctx: Ctx,
  x: number, y: number,
  w: number, h: number,
  canvasH: number,
  timestamp: number,
): void {
  // 1. Moonbeam cast into the room
  drawMoonbeam(ctx, x, y, w, canvasH, timestamp);

  // 2. Outer window frame
  box(ctx, x - 6, y, w + 12, h + 10, C.windowFrame, '#283c5a', 2, 2);

  // 3. Glass pane
  ctx.fillStyle = C.windowFill;
  ctx.fillRect(x, y, w, h);

  // 4. Twinkling stars in night sky
  drawStars(ctx, x, y, w, h, timestamp);

  // 5. Moon glow gradient
  const glow = ctx.createRadialGradient(x + w * 0.5, y + h * 0.4, 2, x + w * 0.5, y + h * 0.4, w * 0.85);
  glow.addColorStop(0,   'rgba(210, 230, 255, 0.25)');
  glow.addColorStop(0.4, 'rgba(140, 180, 255, 0.09)');
  glow.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  // 6. Pane dividers
  ctx.strokeStyle = C.windowDiv;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();

  // 7. Outer border
  ctx.strokeStyle = C.windowFrame;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function drawStars(ctx: Ctx, wx: number, wy: number, ww: number, wh: number, timestamp: number): void {
  const stars = [
    { x: 0.2, y: 0.25, baseA: 0.6, speed: 0.003 },
    { x: 0.35, y: 0.7,  baseA: 0.5, speed: 0.004 },
    { x: 0.75, y: 0.3,  baseA: 0.7, speed: 0.0025 },
    { x: 0.85, y: 0.65, baseA: 0.4, speed: 0.005 },
    { x: 0.55, y: 0.15, baseA: 0.65, speed: 0.0035 },
  ];

  for (const s of stars) {
    const alpha = s.baseA + Math.sin(timestamp * s.speed + s.x * 10) * 0.3;
    ctx.fillStyle = `rgba(240, 248, 255, ${Math.max(0.1, alpha)})`;
    ctx.fillRect(wx + s.x * ww, wy + s.y * wh, 1.5, 1.5);
  }
}

function drawMoonbeam(
  ctx: Ctx,
  wx: number, _wy: number, ww: number,
  canvasH: number,
  timestamp: number,
): void {
  const cx = wx + ww / 2;
  const spread = 170;
  const topY = 0;

  const grad = ctx.createLinearGradient(cx, topY, cx, canvasH);
  grad.addColorStop(0,    'rgba(165,195,255,0.075)');
  grad.addColorStop(0.55, 'rgba(155,185,255,0.03)');
  grad.addColorStop(1,    'rgba(155,185,255,0)');

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(wx, topY);
  ctx.lineTo(wx + ww, topY);
  ctx.lineTo(cx + spread, canvasH);
  ctx.lineTo(cx - spread, canvasH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Floating dust particles in the beam
  for (const p of DUST_PARTICLES) {
    const floatY = (p.y + Math.sin(timestamp * p.speed + p.phase) * 14) % canvasH;
    const floatX = p.x + Math.cos(timestamp * p.speed * 0.8 + p.phase) * 8;
    const alpha = 0.25 + Math.sin(timestamp * 0.002 + p.phase) * 0.15;

    ctx.fillStyle = `rgba(215, 235, 255, ${Math.max(0.05, alpha)})`;
    ctx.beginPath();
    ctx.arc(floatX, floatY, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Door ─────────────────────────────────────────────────────────────────────

function drawDoor(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = C.wallCorner;
  ctx.fillRect(x - 2, y - 4, w + 4, h + 8);

  box(ctx, x, y, w, h, C.doorFill, C.doorFrame, 2);

  const panelX = x + 4;
  const panelW = w - 8;
  const panelH = (h - 18) * 0.46;

  ctx.strokeStyle = C.doorPanel;
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, y + 6, panelW, panelH);
  ctx.strokeRect(panelX, y + 6 + panelH + 6, panelW, panelH);

  // Knob
  const kx = x + w - 8;
  const ky = y + h * 0.52;
  ctx.fillStyle = C.doorKnob;
  ctx.beginPath();
  ctx.arc(kx, ky, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = C.doorKnobHi;
  ctx.beginPath();
  ctx.arc(kx - 1, ky - 1, 2, 0, Math.PI * 2);
  ctx.fill();

  // Outer frame
  ctx.strokeStyle = C.doorFrame;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}
