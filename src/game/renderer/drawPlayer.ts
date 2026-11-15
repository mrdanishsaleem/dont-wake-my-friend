import type { RenderState } from '../../types';
import { CHARACTER_LENGTH } from './characterScale';
import playerSpritesUrl from '../../assets/player-sprites.png';

const playerSprites = new Image();
playerSprites.src = playerSpritesUrl;

// Bounds of each pose in the original sheet, before resizing.
const sheetWidth = 1774;
const sheetHeight = 887;
const poses = {
  down: { x: 130, y: 32, w: 390, h: 832, footAnchor: 0.46 },
  up: { x: 686, y: 9, w: 392, h: 866, footAnchor: 0.46 },
  right: { x: 1238, y: 31, w: 421, h: 836, footAnchor: 0.64 },
};

export function drawPlayer(ctx: CanvasRenderingContext2D, { player, timestamp }: RenderState): void {
  const centerX = player.x + player.w / 2;
  const feetY = player.y + player.h / 2 + 5;
  const stride = player.moving ? Math.sin(timestamp * (player.sneaking ? 0.009 : 0.015)) : 0;

  ctx.save();
  const shadow = ctx.createRadialGradient(centerX, feetY, 1, centerX, feetY, 14);
  shadow.addColorStop(0, 'rgba(4, 8, 12, 0.84)');
  shadow.addColorStop(1, 'rgba(4, 8, 12, 0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(centerX, feetY, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (playerSprites.naturalWidth > 0) {
    const facingLeft = player.facing === 'left';
    const pose = poses[player.facing === 'left' ? 'right' : player.facing];
    const height = CHARACTER_LENGTH;
    const width = height * pose.w / pose.h;
    const scaleX = playerSprites.naturalWidth / sheetWidth;
    const scaleY = playerSprites.naturalHeight / sheetHeight;

    ctx.translate(centerX + stride * 0.7, feetY - Math.abs(stride) * 1.4);
    ctx.rotate(stride * 0.04);
    if (facingLeft) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      playerSprites, pose.x * scaleX, pose.y * scaleY, pose.w * scaleX, pose.h * scaleY,
      -width * pose.footAnchor, -height, width, height,
    );
  } else {
    ctx.fillStyle = '#bccfae';
    ctx.beginPath();
    ctx.arc(centerX, feetY - 5, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
