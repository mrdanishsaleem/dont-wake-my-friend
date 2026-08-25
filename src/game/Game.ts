import type { Room, RenderState, InputState, Vec2, MissionStats } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { BEDROOM }             from '../data/room';
import { Player }              from './Player';
import { NoiseSystem }         from './NoiseSystem';
import { WakeSystem }          from './WakeSystem';
import { InteractionSystem }   from './InteractionSystem';
import { MissionSystem }       from './MissionSystem';
import { sound }               from './AudioSystem';
import { drawRoom }            from './renderer/drawRoom';
import { drawFurniture }       from './renderer/drawFurniture';
import { drawFriend }          from './renderer/drawFriend';
import { drawPlayer }          from './renderer/drawPlayer';
import { drawInteraction }     from './renderer/drawInteraction';
import { drawDebugCollision }  from './renderer/drawDebug';
import { useGameStore }        from '../store/gameStore';

/** Development flag: set to true to display bounding boxes and collision hitboxes. */
export const DEBUG_COLLISION = false;

/**
 * Game — owns the canvas rendering loop, physics, stealth, and mission systems.
 */
export class Game {
  private ctx:                CanvasRenderingContext2D;
  private room:               Room;
  private player:             Player;
  private noiseSystem:        NoiseSystem;
  private wakeSystem:         WakeSystem;
  private interactionSystem:  InteractionSystem;
  private missionSystem:      MissionSystem;
  private inputRef:           { current: InputState };
  private rafId:              number  = 0;
  private running:            boolean = false;
  private lastTime:           number  = 0;
  private lastInteractPressed: boolean = false;

  constructor(
    ctx:      CanvasRenderingContext2D,
    inputRef: { current: InputState },
  ) {
    this.ctx      = ctx;
    this.room     = JSON.parse(JSON.stringify(BEDROOM)) as Room;
    this.inputRef = inputRef;

    // Spawn near bottom-left — open floor area, away from furniture
    this.player = new Player(100, 420);

    // Calculate sleeping friend's head position
    const bed = this.room.objects.find((o) => o.id === 'bed-main');
    const friendHeadPos: Vec2 = bed
      ? { x: bed.bounds.x + bed.bounds.w - 40, y: bed.bounds.y + bed.bounds.h * 0.36 }
      : { x: 890, y: 115 };

    this.noiseSystem       = new NoiseSystem(friendHeadPos);
    this.wakeSystem        = new WakeSystem(0);
    this.interactionSystem = new InteractionSystem();
    this.missionSystem      = new MissionSystem();

    this.initInteractables();
  }

  private initInteractables(): void {
    const glass = this.room.objects.find((o) => o.id === 'decor-glass');
    const glassPos: Vec2 = glass
      ? { x: glass.bounds.x + glass.bounds.w / 2, y: glass.bounds.y + glass.bounds.h / 2 }
      : { x: 547, y: 76 };

    this.interactionSystem.register({
      id: 'decor-glass',
      name: 'Glass of Water',
      x: glassPos.x,
      y: glassPos.y,
      radius: 65,
      promptText: 'Pick up Glass of Water',
      noiseAmount: 10,
      active: true,
    });
  }

  // ── Lifecycle ────────────────────────────────────────────

  start(): void {
    if (this.running) return;
    this.running  = true;
    this.lastTime = performance.now();
    this.rafId    = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  restart(): void {
    this.player.state.x = 100;
    this.player.state.y = 420;
    this.player.state.vx = 0;
    this.player.state.vy = 0;
    this.player.state.facing = 'down';
    this.player.state.moving = false;

    // Reset room items
    const glass = this.room.objects.find((o) => o.id === 'decor-glass');
    if (glass) {
      if (!glass.meta) glass.meta = {};
      glass.meta.collected = false;
    }

    this.noiseSystem.reset();
    this.wakeSystem.reset();
    this.interactionSystem.reset();
    this.missionSystem.reset();
    this.initInteractables();

    useGameStore.getState().resetGame();
  }

  // ── Main loop ────────────────────────────────────────────

  private loop = (timestamp: number): void => {
    if (!this.running) return;

    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(dt, timestamp);
    this.render(timestamp);

    this.rafId = requestAnimationFrame(this.loop);
  };

  // ── Update ───────────────────────────────────────────────

  private update(dt: number, timestamp: number): void {
    const gameStatus = this.missionSystem.getGameStatus();
    const isGameOver = this.wakeSystem.getIsGameOver();

    // 1. If actively playing, process gameplay systems
    if (gameStatus === 'PLAYING') {
      this.player.update(dt, this.inputRef.current, this.room);

      const playerCenter: Vec2 = {
        x: this.player.state.x + this.player.state.w / 2,
        y: this.player.state.y + this.player.state.h / 2,
      };

      this.interactionSystem.update(dt, playerCenter, timestamp);

      // Handle interaction input
      const isInteractHeld = this.inputRef.current.interact;
      if (isInteractHeld && !this.lastInteractPressed) {
        this.handleInteraction(timestamp);
      }
      this.lastInteractPressed = isInteractHeld;

      // Update noise & wake decay
      const wakeDelta = this.noiseSystem.update(dt, this.player.state, timestamp);
      this.wakeSystem.update(wakeDelta);

      // Check mission failure on wake limit
      const currentStats = {
        maxWakeLevel: this.wakeSystem.getData().maxWakeLevel,
        totalNoiseGenerated: this.noiseSystem.getTotalNoiseGenerated(),
      };
      this.missionSystem.update(dt, this.wakeSystem.getIsGameOver(), currentStats);
    }

    // 2. Sync with Zustand store for React UI
    const wakeData = this.wakeSystem.getData(
      this.noiseSystem.getCurrentNoiseRate(),
      this.noiseSystem.getTotalNoiseGenerated(),
    );
    const nearby = this.interactionSystem.getNearby();
    const currentMission = this.missionSystem.getCurrentMission();

    const store = useGameStore.getState();
    store.setWakeData(wakeData);
    store.setGameStatus(this.missionSystem.getGameStatus());
    store.setCurrentMission(currentMission);
    store.setElapsedTime(this.missionSystem.getElapsedTime());
    store.setNearbyPrompt(nearby ? nearby.promptText : null);
  }

  private handleInteraction(timestamp: number): void {
    const result = this.interactionSystem.interact(timestamp);
    if (!result) return;

    const { item, noise } = result;

    if (item.id === 'decor-glass') {
      // 1. Play sounds
      sound.playPickupSound();

      // 2. Generate noise
      const itemPos: Vec2 = { x: item.x, y: item.y };
      this.noiseSystem.emitNoise(noise, itemPos, 'interaction', timestamp);

      const distMult = this.noiseSystem.getDistanceMultiplier(itemPos);
      const effectiveWakeDelta = noise * distMult;
      this.wakeSystem.update(effectiveWakeDelta);

      // 3. Remove/collect the glass
      this.interactionSystem.setInteractableActive(item.id, false);

      const roomGlass = this.room.objects.find((o) => o.id === item.id);
      if (roomGlass) {
        if (!roomGlass.meta) roomGlass.meta = {};
        roomGlass.meta.collected = true;
      }

      const store = useGameStore.getState();
      store.setHasWaterGlass(true);

      // 4. Complete Mission if friend didn't wake up
      if (!this.wakeSystem.getIsGameOver()) {
        const stats: MissionStats = {
          timeTaken: this.missionSystem.getElapsedTime(),
          maxWakeLevel: Math.round(this.wakeSystem.getData().maxWakeLevel),
          totalNoiseGenerated: Math.round(this.noiseSystem.getTotalNoiseGenerated()),
        };

        this.missionSystem.completeMission(stats);
        store.setMissionStats(stats);
        store.setGameStatus('GAME_COMPLETE');
        sound.playSuccessSound();
      }
    }
  }

  // ── Render ───────────────────────────────────────────────

  private render(timestamp: number): void {
    const { ctx, room } = this;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const wakeData = this.wakeSystem.getData(
      this.noiseSystem.getCurrentNoiseRate(),
      this.noiseSystem.getTotalNoiseGenerated(),
    );

    const nearbyInteractable = this.interactionSystem.getNearby();
    const interactionEffects = this.interactionSystem.getEffects();
    const gameStatus = this.missionSystem.getGameStatus();

    const state: RenderState = {
      timestamp,
      player: this.player.state,
      wake: wakeData,
      nearbyInteractable,
      interactionEffects,
      gameStatus,
      currentMission: this.missionSystem.getCurrentMission(),
    };

    // 1. Base scene
    drawRoom(ctx, room);
    drawFurniture(ctx, room);
    drawFriend(ctx, room, state);
    drawPlayer(ctx, state);

    // 2. Interaction prompts & effects
    drawInteraction(ctx, state);

    // 3. Danger alerts
    this.drawDangerEffects(ctx, wakeData.wakeLevel, timestamp);

    // 4. Game Complete or Game Over banner overlays
    if (gameStatus === 'GAME_COMPLETE') {
      this.drawGameCompleteOverlay(ctx, timestamp);
    } else if (wakeData.isGameOver || gameStatus === 'GAME_OVER') {
      this.drawGameOverOverlay(ctx, timestamp);
    }

    // 5. Optional collision debug overlay
    if (DEBUG_COLLISION) {
      drawDebugCollision(ctx, room, this.player.state);
    }
  }

  // ── Visual feedback overlays ──────────────────────────────

  private drawDangerEffects(ctx: CanvasRenderingContext2D, wakeLevel: number, timestamp: number): void {
    if (wakeLevel < 70) return;

    ctx.save();
    if (wakeLevel >= 95) {
      const pulse = 0.35 + Math.sin(timestamp * 0.008) * 0.15;
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (wakeLevel >= 85) {
      const pulse = 0.2 + Math.sin(timestamp * 0.005) * 0.1;
      ctx.strokeStyle = `rgba(249, 115, 22, ${pulse})`;
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (wakeLevel >= 70) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    ctx.restore();
  }

  private drawGameCompleteOverlay(ctx: CanvasRenderingContext2D, timestamp: number): void {
    ctx.save();

    // Dark teal semi-transparent tint
    ctx.fillStyle = 'rgba(6, 15, 25, 0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pulse = 1 + Math.sin(timestamp * 0.005) * 0.02;
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
    ctx.shadowBlur = 20;

    ctx.font = 'bold 34px "Space Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MISSION COMPLETE!', 0, -35);

    ctx.font = '500 15px "Inter", system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.shadowBlur = 0;
    ctx.fillText('You got the glass of water without waking your friend.', 0, 5);

    // Subtle stats summary
    const stats = this.missionSystem.getCurrentMission()?.stats;
    if (stats) {
      ctx.font = '12px "Space Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(
        `TIME: ${stats.timeTaken.toFixed(1)}s  |  MAX WAKE: ${stats.maxWakeLevel}%  |  TOTAL NOISE: ${stats.totalNoiseGenerated}`,
        0,
        38,
      );
    }

    ctx.restore();
    ctx.restore();
  }

  private drawGameOverOverlay(ctx: CanvasRenderingContext2D, timestamp: number): void {
    ctx.save();

    ctx.fillStyle = 'rgba(10, 8, 18, 0.75)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pulse = 1 + Math.sin(timestamp * 0.006) * 0.03;
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.shadowBlur = 24;

    ctx.font = 'bold 36px "Space Mono", monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU WOKE YOUR FRIEND!', 0, -20);

    ctx.font = '14px "Space Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.shadowBlur = 0;
    ctx.fillText('Too much noise was made near the bed.', 0, 25);

    ctx.restore();
    ctx.restore();
  }
}
