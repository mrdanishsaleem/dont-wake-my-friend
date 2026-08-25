/**
 * drawPrimitives — low-level canvas helpers shared by all renderers.
 *
 * Keep these pure (no game state). They are thin wrappers that reduce
 * boilerplate and ensure consistent canvas state restoration.
 */

type Ctx = CanvasRenderingContext2D;

/** Fill a rounded rectangle. */
export function fillRoundRect(
  ctx: Ctx,
  x: number, y: number,
  w: number, h: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Stroke a rounded rectangle. */
export function strokeRoundRect(
  ctx: Ctx,
  x: number, y: number,
  w: number, h: number,
  r: number,
  color: string,
  lineWidth = 1,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

/** Draw a filled rectangle with an outline in one call. */
export function box(
  ctx: Ctx,
  x: number, y: number,
  w: number, h: number,
  fill: string,
  stroke: string,
  lineWidth = 1,
  radius = 0,
): void {
  if (radius > 0) {
    fillRoundRect(ctx, x, y, w, h, radius, fill);
    strokeRoundRect(ctx, x, y, w, h, radius, stroke, lineWidth);
  } else {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, w, h);
  }
}

/** Draw a drop shadow below a rect (call before drawing the rect itself). */
export function dropShadow(
  ctx: Ctx,
  x: number, y: number,
  w: number, h: number,
  offsetY = 6,
  blur = 12,
  color = 'rgba(0,0,0,0.45)',
): void {
  ctx.save();
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = offsetY;
  ctx.shadowBlur    = blur;
  ctx.shadowColor   = color;
  ctx.fillStyle     = 'rgba(0,0,0,0.01)'; // transparent fill to trigger shadow
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Draw text with optional shadow glow. */
export function drawText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  opts: {
    font?: string;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    glow?: string;
    glowBlur?: number;
  } = {},
): void {
  ctx.save();
  ctx.font         = opts.font      ?? '12px monospace';
  ctx.fillStyle    = opts.color     ?? '#ffffff';
  ctx.textAlign    = opts.align     ?? 'left';
  ctx.textBaseline = opts.baseline  ?? 'alphabetic';
  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur  = opts.glowBlur ?? 6;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Linear gradient fill between two y positions. */
export function vertGradFill(
  ctx: Ctx,
  x: number, y: number,
  w: number, h: number,
  topColor: string,
  bottomColor: string,
): void {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}
