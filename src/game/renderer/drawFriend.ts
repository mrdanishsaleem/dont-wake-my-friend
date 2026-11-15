import type { Room, RenderState } from '../../types';
import sleepingUrl from '../../assets/sleeping-friend.png';
import awakeUrl from '../../assets/awake-friend.png';

const sleeping = new Image();
sleeping.src = sleepingUrl;
const awake = new Image();
awake.src = awakeUrl;

export function drawFriend(ctx: CanvasRenderingContext2D, room: Room, state: RenderState): void {
  const bed = room.objects.find(({ id }) => id === 'bed-main');
  if (!bed || !sleeping.naturalWidth) return;

  const { x, y, w, h } = bed.bounds;
  const ai = state.friendAI;
  const isAwake = state.wake.friendState === 'AWAKE';
  const isPeeking = (ai?.eyesOpenAmount ?? 0) > 0.4;
  const showAwake = (isAwake || isPeeking) && awake.naturalWidth > 0;
  const pose = showAwake ? awake : sleeping;
  // Fractions of the source sprite used to align the head with the pillow.
  const head = showAwake ? { x: 0.922, y: 0.35 } : { x: 0.924, y: 0.39 };
  const breath = ai?.breathingOffset ?? 0;
  const lift = ai?.sitUpProgress ?? 0;
  const width = w;
  const height = width * pose.naturalHeight / pose.naturalWidth;

  ctx.save();
  ctx.translate(x + w * head.x + (ai?.headOffset.x ?? 0), y + h * 0.36);
  ctx.rotate((ai?.facingAngle ?? 0) * 0.13);
  ctx.translate(0, (ai?.bodyOffset.y ?? 0) * 0.5 - lift * 5);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.54)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.imageSmoothingQuality = 'high';
  const breathingHeight = height + breath * 0.3;
  ctx.drawImage(pose, -width * head.x, -breathingHeight * head.y, width, breathingHeight);
  ctx.restore();
}
