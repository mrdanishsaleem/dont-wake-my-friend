import type { Room, RenderState, InputState, Vec2, Difficulty, Mission } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { BEDROOM, ROOMS }      from '../data/room';
import { AVAILABLE_MISSIONS }  from '../data/missions';
import { Player }              from './Player';
import { NoiseSystem }         from './NoiseSystem';
import { WakeSystem }          from './WakeSystem';
import { FriendAI }            from './FriendAI';
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
 * Game — coordinates rendering, screen effects, procedural audio, and game state.
 */
export class Game {
  private ctx:                 CanvasRenderingContext2D;
  private room:                Room;
  private player:              Player;
  private noiseSystem:         NoiseSystem;
  private wakeSystem:          WakeSystem;
  private friendAI:            FriendAI;
  private interactionSystem:   InteractionSystem;
  private missionSystem:       MissionSystem;
  private inputRef:            { current: InputState };
  private friendHeadPos:       Vec2;
  private rafId:               number  = 0;
  private running:             boolean = false;
  private lastTime:            number  = 0;
  private lastInteractPressed: boolean = false;
  private lastPausePressed:    boolean = false;
  private lastDistractPressed: boolean = false;

  // Screen shake & visual effects
  private shakeIntensity:      number  = 0;
  private lastWakeTier:        number  = 0;

  constructor(
    ctx:      CanvasRenderingContext2D,
    inputRef: { current: InputState },
  ) {
    this.ctx      = ctx;
    this.room     = JSON.parse(JSON.stringify(BEDROOM)) as Room;
    this.inputRef = inputRef;

    this.player = new Player(100, 420);

    const bed = this.room.objects.find((o) => o.id === 'bed-main');
    this.friendHeadPos = bed
      ? { x: bed.bounds.x + bed.bounds.w - 40, y: bed.bounds.y + bed.bounds.h * 0.36 }
      : { x: 890, y: 115 };

    this.noiseSystem       = new NoiseSystem(this.friendHeadPos);
    this.wakeSystem        = new WakeSystem(0);
    this.friendAI          = new FriendAI();
    this.interactionSystem = new InteractionSystem();
    this.missionSystem     = new MissionSystem();

    this.initInteractables();
    this.applyDifficulty(useGameStore.getState().difficulty);
  }

  private initInteractables(): void {
    const mission = this.missionSystem.getCurrentMission();
    if (!mission?.target) return;
    const target = this.room.objects.find((object) => object.id === mission.target);
    if (!target) return;
    const labels: Record<string, string> = { 'decor-glass': 'Glass of Water', 'decor-charger': 'Phone Charger', 'decor-headphones': 'Headphones', 'decor-snacks': 'Snacks', 'decor-phone': 'Alarm Phone', 'decor-keys': 'Keys', 'door-main': 'Bedroom Door' };
    const risks: Record<string, number> = { 'decor-glass': 10, 'decor-charger': 6, 'decor-headphones': 4, 'decor-snacks': 9, 'decor-phone': 14, 'decor-keys': 16, 'door-main': 12 };
    this.interactionSystem.register({ id: target.id, name: labels[target.id] ?? 'Mission Item', x: target.bounds.x + target.bounds.w / 2, y: target.bounds.y + target.bounds.h / 2, radius: 65, promptText: `Get ${labels[target.id] ?? 'item'}`, noiseAmount: risks[target.id] ?? 8, active: true });
  }

  private applyDifficulty(difficulty: Difficulty): void {
    const difficultySettings = { EASY: [0.65, 1.5], NORMAL: [1, 1], HARD: [1.45, 0.55] } as const;
    const floorMultiplier = this.room.floorType === 'carpet' ? 0.5 : this.room.floorType === 'tile' ? 1.55 : 1;
    const [noise, recovery] = difficultySettings[difficulty];
    this.noiseSystem.setDifficulty(noise * floorMultiplier, recovery);
  }

  private setMissionForRun(): void {
    const mission = AVAILABLE_MISSIONS[Math.floor(Math.random() * AVAILABLE_MISSIONS.length)] as Mission;
    const roomKey = mission.id === 'mission-snacks' ? 'kitchen' : mission.id === 'mission-alarm' ? 'bathroom' : mission.id === 'mission-keys' ? 'hallway' : mission.id === 'mission-headphones' ? 'livingRoom' : 'bedroom';
    this.room = JSON.parse(JSON.stringify(ROOMS[roomKey] ?? BEDROOM)) as Room;
    if (mission.id === 'mission-charger') this.room.objects.push({ id: 'decor-charger', kind: 'decor', bounds: { x: 118 + Math.floor(Math.random() * 70), y: 286, w: 20, h: 18 }, solid: false, interact: true, meta: { type: 'charger' } });
    // Small safe variation makes routes feel fresh without moving a target into danger.
    const target = mission.target && this.room.objects.find((item) => item.id === mission.target);
    if (target && target.id !== 'door-main') target.bounds.x += (Math.floor(Math.random() * 3) - 1) * 28;
    this.missionSystem.startMission(mission);
    this.applyDifficulty(useGameStore.getState().difficulty);
  }

  // ── Lifecycle & Controls ─────────────────────────────────

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

  pause(): void {
    this.missionSystem.pause();
    useGameStore.getState().setGameStatus('PAUSED');
  }

  resume(): void {
    this.missionSystem.resume();
    useGameStore.getState().setGameStatus('PLAYING');
  }

  togglePause(): void {
    this.missionSystem.togglePause();
    useGameStore.getState().setGameStatus(this.missionSystem.getGameStatus());
  }

  restart(): void {
    this.player.state.x = 100;
    this.player.state.y = 420;
    this.player.state.vx = 0;
    this.player.state.vy = 0;
    this.player.state.facing = 'down';
    this.player.state.moving = false;

    this.setMissionForRun();

    this.shakeIntensity = 0;
    this.lastWakeTier = 0;

    this.noiseSystem.reset();
    this.wakeSystem.reset();
    this.friendAI.reset();
    this.interactionSystem.reset();
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
    // 1. Handle Pause toggle (Escape key)
    const isPauseHeld = this.inputRef.current.pause;
    if (isPauseHeld && !this.lastPausePressed) {
      const currentStatus = this.missionSystem.getGameStatus();
      if (currentStatus === 'PLAYING' || currentStatus === 'PAUSED') {
        this.togglePause();
      }
    }
    this.lastPausePressed = isPauseHeld;

    const gameStatus = this.missionSystem.getGameStatus();

    // 2. Decay screen shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 22);
    }

    // 3. If actively playing, process gameplay
    if (gameStatus === 'PLAYING') {
      this.player.update(dt, this.inputRef.current, this.room);

      // Play soft footstep procedural audio while moving
      if (this.player.state.moving) {
        sound.playFootstep();
      }

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

      const isDistractHeld = this.inputRef.current.distract;
      if (isDistractHeld && !this.lastDistractPressed) this.throwDistraction(timestamp);
      this.lastDistractPressed = isDistractHeld;

      // Update noise & wake decay
      const wakeDelta = this.noiseSystem.update(dt, this.player.state, timestamp);
      this.wakeSystem.update(wakeDelta);

      // Audio sting on wake tier increase
      const wakeLvl = this.wakeSystem.getWakeLevel();
      if (wakeLvl >= 85 && this.lastWakeTier < 85) {
        sound.playWarningSound();
        this.lastWakeTier = 85;
      } else if (wakeLvl >= 70 && this.lastWakeTier < 70) {
        sound.playWarningSound();
        this.lastWakeTier = 70;
      } else if (wakeLvl < 65) {
        this.lastWakeTier = 0;
      }

      // Heartbeat audio pulse at critical levels
      if (wakeLvl >= 85) {
        sound.playHeartbeat();
      }

      // Check game over
      if (this.wakeSystem.getIsGameOver()) {
        sound.playGameOverSound();
        this.shakeIntensity = 12;
      }

      // Check mission failure on wake limit
      const currentStats = {
        maxWakeLevel: this.wakeSystem.getData().maxWakeLevel,
        totalNoiseGenerated: this.noiseSystem.getTotalNoiseGenerated(),
      };
      this.missionSystem.update(dt, this.wakeSystem.getIsGameOver(), currentStats);
    }

    // 4. Update Friend AI routines
    const wakeData = this.wakeSystem.getData(
      this.noiseSystem.getCurrentNoiseRate(),
      this.noiseSystem.getTotalNoiseGenerated(),
    );

    if (gameStatus !== 'PAUSED') {
      this.friendAI.update(dt, wakeData.friendState, wakeData.wakeLevel, timestamp);
    }

    // 5. Sync with Zustand store for React UI
    const nearby = this.interactionSystem.getNearby();
    const currentMission = this.missionSystem.getCurrentMission();

    const store = useGameStore.getState();
    store.setWakeData(wakeData);
    store.setGameStatus(this.missionSystem.getGameStatus());
    store.setCurrentMission(currentMission);
    store.setElapsedTime(this.missionSystem.getElapsedTime());
    store.setNearbyPrompt(nearby && gameStatus === 'PLAYING' ? nearby.promptText : null);
  }

  private handleInteraction(timestamp: number): void {
    const result = this.interactionSystem.interact(timestamp);
    if (!result) return;

    const { item, noise } = result;

    if (item.id === this.missionSystem.getCurrentMission()?.target) {
      // 1. Play sounds & screen shake
      sound.playPickupSound();
      this.shakeIntensity = 5;

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
        const playerCenter = { x: this.player.state.x + this.player.state.w / 2, y: this.player.state.y + this.player.state.h / 2 };
        const rawStats = {
          timeTaken: this.missionSystem.getElapsedTime(),
          maxWakeLevel: Math.round(this.wakeSystem.getData().maxWakeLevel),
          totalNoiseGenerated: Math.round(this.noiseSystem.getTotalNoiseGenerated()),
          distanceBonus: Math.min(10, Math.round(Math.hypot(playerCenter.x - this.friendHeadPos.x, playerCenter.y - this.friendHeadPos.y) / 55)),
        };

        this.missionSystem.completeMission(rawStats);
        const mission = this.missionSystem.getCurrentMission();
        if (mission?.stats) {
          store.setMissionStats(mission.stats);
          store.recordHighScore(mission.stats);
        }
        store.setGameStatus('GAME_COMPLETE');
        sound.playSuccessSound();
      }
    }
  }

  private throwDistraction(timestamp: number): void {
    const player = this.player.state;
    const origin = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
    const direction = player.facing === 'up' ? [0, -1] : player.facing === 'down' ? [0, 1] : player.facing === 'left' ? [-1, 0] : [1, 0];
    const landing = { x: Math.max(40, Math.min(CANVAS_WIDTH - 40, origin.x + direction[0] * 170)), y: Math.max(45, Math.min(CANVAS_HEIGHT - 40, origin.y + direction[1] * 170)) };
    const noise = 11;
    this.noiseSystem.emitNoise(noise, landing, 'distraction', timestamp);
    this.wakeSystem.update(noise * this.noiseSystem.getDistanceMultiplier(landing));
    this.interactionSystem.addEffect(landing.x, landing.y, timestamp, 'DISTRACTION');
  }

  // ── Render ───────────────────────────────────────────────

  private render(timestamp: number): void {
    const { ctx, room } = this;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply Screen Shake if active
    ctx.save();
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
    }

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
      friendAI: this.friendAI.getState(),
      nearbyInteractable: gameStatus === 'PLAYING' ? nearbyInteractable : null,
      interactionEffects,
      gameStatus,
      currentMission: this.missionSystem.getCurrentMission(),
    };

    // 1. Base scene
    drawRoom(ctx, room, timestamp);
    drawFurniture(ctx, room);
    drawFriend(ctx, room, state);
    drawPlayer(ctx, state);

    // 2. Interaction prompts & effects (when playing)
    if (gameStatus === 'PLAYING') {
      drawInteraction(ctx, state, this.friendHeadPos);
      this.drawDangerEffects(ctx, wakeData.wakeLevel, timestamp);
    }

    // 3. Optional collision debug overlay
    if (DEBUG_COLLISION) {
      drawDebugCollision(ctx, room, this.player.state);
    }

    ctx.restore();
  }

  // ── Visual feedback overlays (vignette & heartbeat border) ──

  private drawDangerEffects(ctx: CanvasRenderingContext2D, wakeLevel: number, timestamp: number): void {
    if (wakeLevel < 70) return;

    ctx.save();
    if (wakeLevel >= 90) {
      // Urgent pulsing red heartbeat vignette
      const pulse = 0.35 + Math.sin(timestamp * 0.01) * 0.18;
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dark red corner vignettes
      const vig = ctx.createRadialGradient(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        CANVAS_WIDTH * 0.3,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2,
        CANVAS_WIDTH * 0.55,
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(220, 38, 38, ${pulse * 0.35})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (wakeLevel >= 85) {
      const pulse = 0.2 + Math.sin(timestamp * 0.006) * 0.12;
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
}
