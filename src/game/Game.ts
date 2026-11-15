import type { Room, RenderState, InputState, TouchInput, Vec2, Difficulty, Mission, DistractionThrow } from '../types';
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
import { drawRoom, drawRoomLighting }            from './renderer/drawRoom';
import { drawFurniture }       from './renderer/drawFurniture';
import { drawFriend }          from './renderer/drawFriend';
import { drawPlayer }          from './renderer/drawPlayer';
import { drawInteraction }     from './renderer/drawInteraction';
import { drawDebugCollision }  from './renderer/drawDebug';
import { useGameStore }        from '../store/gameStore';

/** Development flag: set to true to display bounding boxes and collision hitboxes. */
export const DEBUG_COLLISION = false;

const MAX_FRAME_SECONDS = 0.1;
const ALARM_WAKE_PER_SECOND = 7;
const ALARM_BEEP_INTERVAL = 1.2;

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
  private readonly touchInput?: { current: TouchInput };
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
  private appliedDifficulty: Difficulty | undefined;
  private timeUntilAlarmBeep = 0;
  private timeUntilFootstep = 0;
  private distraction: DistractionThrow | null = null;
  private lastWakeTier:        number  = 0;

  constructor(
    ctx:      CanvasRenderingContext2D,
    inputRef: { current: InputState },
    touchInput?: { current: TouchInput },
  ) {
    this.ctx      = ctx;
    this.room     = JSON.parse(JSON.stringify(BEDROOM)) as Room;
    this.inputRef = inputRef;
    this.touchInput = touchInput;

    this.player = new Player(73, 420);

    const bed = this.room.objects.find((o) => o.id === 'bed-main');
    this.friendHeadPos = bed
      ? { x: bed.bounds.x + bed.bounds.w * 0.923, y: bed.bounds.y + bed.bounds.h * 0.36 }
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
    this.interactionSystem.register({ id: target.id, name: labels[target.id] ?? 'Mission Item', x: target.bounds.x + target.bounds.w / 2, y: target.bounds.y + target.bounds.h / 2, radius: 33, promptText: target.id === 'decor-phone' ? 'Silence Alarm' : `Get ${labels[target.id] ?? 'item'}`, noiseAmount: risks[target.id] ?? 8, active: true });
  }

  private applyDifficulty(difficulty: Difficulty): void {
    const difficultySettings = { EASY: [0.65, 1.5], NORMAL: [1, 1], HARD: [1.45, 0.55] } as const;
    const floorMultiplier = this.room.floorType === 'carpet' ? 0.5 : this.room.floorType === 'tile' ? 1.55 : 1;
    const [noise, recovery] = difficultySettings[difficulty];
    this.noiseSystem.setDifficulty(noise * floorMultiplier, recovery);
    this.appliedDifficulty = difficulty;
  }

  private setMissionForRun(): void {
    const mission = AVAILABLE_MISSIONS[Math.floor(Math.random() * AVAILABLE_MISSIONS.length)] as Mission;
    const roomKey = mission.id === 'mission-snacks' ? 'kitchen' : mission.id === 'mission-alarm' ? 'bathroom' : mission.id === 'mission-keys' ? 'hallway' : mission.id === 'mission-headphones' ? 'livingRoom' : 'bedroom';
    this.room = JSON.parse(JSON.stringify(ROOMS[roomKey] ?? BEDROOM)) as Room;
    if (mission.id === 'mission-charger') this.room.objects.push({ id: 'decor-charger', kind: 'decor', bounds: { x: 265, y: 375, w: 26, h: 25 }, solid: false, interact: true, meta: { type: 'charger' } });
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
    this.player.state.x = 73;
    this.player.state.y = 420;
    this.player.state.vx = 0;
    this.player.state.vy = 0;
    this.player.state.facing = 'down';
    this.player.state.moving = false;
    this.player.state.sneaking = false;

    this.setMissionForRun();

    this.shakeIntensity = 0;
    this.lastWakeTier = 0;
    this.timeUntilAlarmBeep = 0;
    this.timeUntilFootstep = 0;
    this.distraction = null;

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

    const dt = Math.max(0, Math.min(MAX_FRAME_SECONDS, (timestamp - this.lastTime) / 1000));
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
      const { difficulty } = useGameStore.getState();
      if (this.appliedDifficulty !== difficulty) this.applyDifficulty(difficulty);

      const keyboard = this.inputRef.current;
      const touch = this.touchInput?.current;
      const directions = touch?.directions;
      this.player.update(dt, {
        ...keyboard,
        up: keyboard.up || !!directions?.has('up'),
        down: keyboard.down || !!directions?.has('down'),
        left: keyboard.left || !!directions?.has('left'),
        right: keyboard.right || !!directions?.has('right'),
        sneak: keyboard.sneak || touch?.sneak,
      }, this.room);

      const touchInteract = touch?.interact;
      const touchDistract = touch?.distract;
      if (touch) {
        touch.interact = false;
        touch.distract = false;
      }

      const playerCenter: Vec2 = {
        x: this.player.state.x + this.player.state.w / 2,
        y: this.player.state.y + this.player.state.h / 2,
      };

      if (this.player.state.moving) {
        this.timeUntilFootstep -= dt;
        if (this.timeUntilFootstep <= 0) {
          const sneaking = this.player.state.sneaking ?? false;
          this.timeUntilFootstep += sneaking ? 0.44 : 0.28;
          sound.playFootstep(this.room.floorType, sneaking);
          this.wakeSystem.update(this.noiseSystem.emitFootstep(this.player.state, playerCenter, timestamp));
        }
      } else {
        this.timeUntilFootstep = 0;
      }

      this.interactionSystem.update(dt, playerCenter, timestamp);

      this.updateDistraction(dt, timestamp);

      // Handle interaction input
      const isInteractHeld = this.inputRef.current.interact;
      if ((touchInteract || (isInteractHeld && !this.lastInteractPressed)) && !this.wakeSystem.getIsGameOver()) {
        this.handleInteraction(timestamp);
      }
      this.lastInteractPressed = isInteractHeld;

      const isDistractHeld = this.inputRef.current.distract;
      if (
        (touchDistract || (isDistractHeld && !this.lastDistractPressed)) &&
        this.missionSystem.getGameStatus() === 'PLAYING' && !this.wakeSystem.getIsGameOver()
      ) {
        this.throwDistraction();
      }
      this.lastDistractPressed = isDistractHeld;

      // Update noise & wake decay
      const wakeDelta = this.noiseSystem.update(dt, this.player.state, timestamp);
      if (this.missionSystem.getGameStatus() === 'PLAYING') {
        const alarmRinging = this.missionSystem.getCurrentMission()?.id === 'mission-alarm';
        this.wakeSystem.update(wakeDelta + (alarmRinging ? ALARM_WAKE_PER_SECOND * dt : 0));

        if (alarmRinging && !this.wakeSystem.getIsGameOver()) {
          this.timeUntilAlarmBeep -= dt;
          if (this.timeUntilAlarmBeep <= 0) {
            sound.playAlarmBeep();
            this.timeUntilAlarmBeep += ALARM_BEEP_INTERVAL;
          }
        }
      }

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

  private throwDistraction(): void {
    if (this.distraction) return;

    const player = this.player.state;
    const origin = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
    const directions: Record<typeof player.facing, Vec2> = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
    };
    const direction = directions[player.facing];
    let landing = origin;
    const obstacles = this.room.objects.filter((object) => object.solid);

    // Stop at the first obstacle along the throw path.
    for (let distance = 4; distance <= 168; distance += 4) {
      const x = origin.x + direction.x * distance;
      const y = origin.y + direction.y * distance;
      if (x < 4 || x > CANVAS_WIDTH - 4 || y < 4 || y > CANVAS_HEIGHT - 4) break;
      if (obstacles.some(({ bounds: b }) => x >= b.x - 3 && x <= b.x + b.w + 3 &&
        y >= b.y - 3 && y <= b.y + b.h + 3)) break;
      landing = { x, y };
    }

    const distance = Math.hypot(landing.x - origin.x, landing.y - origin.y);
    this.distraction = { origin, landing, elapsed: 0, duration: 0.16 + distance / 740 };
  }

  private updateDistraction(dt: number, timestamp: number): void {
    const distraction = this.distraction;
    if (!distraction) return;

    distraction.elapsed += dt;
    if (distraction.elapsed < distraction.duration) return;

    const { landing } = distraction;
    const noise = 11;
    this.distraction = null;
    this.noiseSystem.emitNoise(noise, landing, 'distraction', timestamp);
    this.wakeSystem.update(noise * this.noiseSystem.getDistanceMultiplier(landing));
    this.interactionSystem.addEffect(landing.x, landing.y, timestamp, 'Clink');
    sound.playDistractionImpact();
  }

  // ── Render ───────────────────────────────────────────────

  private render(timestamp: number): void {
    const { ctx, room } = this;

    // Keep the room fixed against the frame. Shake the player on impact.
    const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity;

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
      distraction: this.distraction,
      gameStatus,
      currentMission: this.missionSystem.getCurrentMission(),
    };

    // 1. Base scene
    drawRoom(ctx, room, timestamp);
    drawFurniture(ctx, room);
    drawFriend(ctx, room, state);
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawPlayer(ctx, state);
    ctx.restore();
    drawRoomLighting(ctx, room);

    // 2. Interaction prompts & effects (when playing)
    if (gameStatus === 'PLAYING') {
      drawInteraction(ctx, state);
    }

    // 3. Optional collision debug overlay
    if (DEBUG_COLLISION) {
      drawDebugCollision(ctx, room, this.player.state);
    }

  }
}
