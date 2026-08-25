import type { FriendState, FriendAIState, Vec2 } from '../types';

export class FriendAI {
  private state: FriendState = 'DEEP_SLEEP';
  private breathingPhase: number = 0;

  // Pose and Animation targets
  private facingAngle: number = 0;
  private sitUpProgress: number = 0;
  private eyesOpenAmount: number = 0;
  private headOffset: Vec2 = { x: 0, y: 0 };
  private bodyOffset: Vec2 = { x: 0, y: 0 };

  // Expressions & Bubbles
  private mumbleText: string | null = null;
  private mumbleAlpha: number = 0;
  private mumbleTimer: number = 0;
  private snorePuff: { x: number; y: number; progress: number } | null = null;
  private questionMarkAlpha: number = 0;

  // Random Event Scheduler
  private eventTimer: number = 4; // Start first event after 4s
  private activeEvent: string | null = null;
  private activeEventTimer: number = 0;
  private activeEventDuration: number = 0;

  constructor() {
    this.scheduleNextEvent();
  }

  private scheduleNextEvent(): void {
    if (this.state === 'AWAKE') return;

    if (this.state === 'ALMOST_AWAKE') {
      this.eventTimer = 1.8 + Math.random() * 2.2; // 1.8s - 4s
    } else if (this.state === 'RESTLESS') {
      this.eventTimer = 3.0 + Math.random() * 3.5; // 3s - 6.5s
    } else {
      this.eventTimer = 6.0 + Math.random() * 6.0; // 6s - 12s
    }
  }

  update(dt: number, currentFriendState: FriendState, _wakeLevel: number, timestamp: number): void {
    this.state = currentFriendState;

    // ── 1. Breathing Cycle ───────────────────────────────────────────
    const breathRate = this.state === 'ALMOST_AWAKE' ? 3.0 : this.state === 'RESTLESS' ? 2.4 : 1.6;
    this.breathingPhase += dt * breathRate;

    // ── 2. Mumble & Snore Fade Update ────────────────────────────────
    if (this.mumbleTimer > 0) {
      this.mumbleTimer -= dt;
      if (this.mumbleTimer > 1.2) {
        this.mumbleAlpha = Math.min(1, this.mumbleAlpha + dt * 4);
      } else if (this.mumbleTimer <= 0.5) {
        this.mumbleAlpha = Math.max(0, this.mumbleAlpha - dt * 2);
      }
      if (this.mumbleTimer <= 0) {
        this.mumbleText = null;
        this.mumbleAlpha = 0;
      }
    }

    if (this.snorePuff) {
      this.snorePuff.progress += dt * 1.2;
      if (this.snorePuff.progress >= 1) {
        this.snorePuff = null;
      }
    }

    // ── 3. State-driven base pose targets ────────────────────────────
    if (this.state === 'AWAKE') {
      this.sitUpProgress = Math.min(1, this.sitUpProgress + dt * 4);
      this.eyesOpenAmount = 1;
      this.questionMarkAlpha = 0;
      this.activeEvent = null;
      return;
    }

    // ── 4. Random Event Execution & Scheduling ───────────────────────
    if (this.activeEvent) {
      this.activeEventTimer += dt;
      const progress = Math.min(1, this.activeEventTimer / this.activeEventDuration);

      this.processActiveEvent(progress, dt);

      if (this.activeEventTimer >= this.activeEventDuration) {
        this.activeEvent = null;
        this.scheduleNextEvent();
      }
    } else {
      this.eventTimer -= dt;
      if (this.eventTimer <= 0) {
        this.triggerRandomEvent(timestamp);
      }

      // Smoothly relax back to baseline pose
      this.facingAngle += (0 - this.facingAngle) * Math.min(1, dt * 2.5);
      this.sitUpProgress += (0 - this.sitUpProgress) * Math.min(1, dt * 3);
      this.headOffset.x += (0 - this.headOffset.x) * Math.min(1, dt * 3);
      this.headOffset.y += (0 - this.headOffset.y) * Math.min(1, dt * 3);
      this.bodyOffset.x += (0 - this.bodyOffset.x) * Math.min(1, dt * 3);
      this.bodyOffset.y += (0 - this.bodyOffset.y) * Math.min(1, dt * 3);

      if (this.state === 'ALMOST_AWAKE') {
        this.questionMarkAlpha = 0.6 + Math.sin(timestamp * 0.008) * 0.4;
      } else {
        this.questionMarkAlpha = 0;
        this.eyesOpenAmount += (0 - this.eyesOpenAmount) * Math.min(1, dt * 4);
      }
    }
  }

  private triggerRandomEvent(_timestamp: number): void {
    if (this.state === 'AWAKE') return;

    const r = Math.random();

    if (this.state === 'ALMOST_AWAKE') {
      if (r < 0.45) {
        // Sit up and peek
        this.activeEvent = 'SIT_UP_PEEK';
        this.activeEventDuration = 2.2;
        this.activeEventTimer = 0;
      } else if (r < 0.75) {
        // Restless mumble
        const mumbles = ["huh...?", "what's that?", "who's there...?", "mhm...?"];
        this.triggerMumble(mumbles[Math.floor(Math.random() * mumbles.length)], 2.0);
        this.activeEvent = 'MUMBLE';
        this.activeEventDuration = 2.0;
        this.activeEventTimer = 0;
      } else {
        // Turn head and look
        this.activeEvent = 'LOOK_AROUND';
        this.activeEventDuration = 1.8;
        this.activeEventTimer = 0;
      }
    } else if (this.state === 'RESTLESS') {
      if (r < 0.35) {
        this.activeEvent = 'ROLL_OVER';
        this.activeEventDuration = 2.5;
        this.activeEventTimer = 0;
      } else if (r < 0.7) {
        const mumbles = ["so noisy...", "five more mins...", "hngh...", "shh..."];
        this.triggerMumble(mumbles[Math.floor(Math.random() * mumbles.length)], 2.2);
        this.activeEvent = 'MUMBLE';
        this.activeEventDuration = 2.2;
        this.activeEventTimer = 0;
      } else {
        this.activeEvent = 'ADJUST_PILLOW';
        this.activeEventDuration = 1.8;
        this.activeEventTimer = 0;
      }
    } else {
      // DEEP_SLEEP
      if (r < 0.3) {
        this.activeEvent = 'ROLL_OVER';
        this.activeEventDuration = 3.0;
        this.activeEventTimer = 0;
      } else if (r < 0.55) {
        this.activeEvent = 'ADJUST_PILLOW';
        this.activeEventDuration = 2.0;
        this.activeEventTimer = 0;
      } else if (r < 0.8) {
        this.snorePuff = { x: 0, y: 0, progress: 0 };
        this.activeEvent = 'SNORE';
        this.activeEventDuration = 1.5;
        this.activeEventTimer = 0;
      } else {
        const mumbles = ["zzz...", "mff...", "hmmm...", "zZz..."];
        this.triggerMumble(mumbles[Math.floor(Math.random() * mumbles.length)], 2.0);
        this.activeEvent = 'MUMBLE';
        this.activeEventDuration = 2.0;
        this.activeEventTimer = 0;
      }
    }
  }

  private processActiveEvent(progress: number, _dt: number): void {
    const curve = Math.sin(progress * Math.PI); // 0 -> 1 -> 0

    switch (this.activeEvent) {
      case 'ROLL_OVER':
        this.facingAngle = curve * 0.45;
        this.bodyOffset.y = curve * 3;
        break;

      case 'ADJUST_PILLOW':
        this.headOffset.x = curve * -3;
        this.headOffset.y = curve * -2;
        break;

      case 'SIT_UP_PEEK':
        this.sitUpProgress = curve * 0.6;
        // Briefly open eyes during peak
        this.eyesOpenAmount = curve > 0.3 ? (curve - 0.3) / 0.7 : 0;
        this.questionMarkAlpha = curve;
        break;

      case 'LOOK_AROUND':
        this.headOffset.x = Math.sin(progress * Math.PI * 2) * 3.5;
        this.eyesOpenAmount = curve * 0.5;
        break;

      case 'SNORE':
        // Head slight nod
        this.headOffset.y = curve * 1.5;
        break;
    }
  }

  private triggerMumble(text: string, duration: number): void {
    this.mumbleText = text;
    this.mumbleTimer = duration;
    this.mumbleAlpha = 0;
  }

  getState(): FriendAIState {
    const breathingOffset = Math.sin(this.breathingPhase) * 1.4;

    return {
      state: this.state,
      breathingOffset,
      facingAngle: this.facingAngle,
      sitUpProgress: this.sitUpProgress,
      eyesOpenAmount: this.eyesOpenAmount,
      headOffset: { ...this.headOffset },
      bodyOffset: { ...this.bodyOffset },
      mumbleText: this.mumbleText,
      mumbleAlpha: this.mumbleAlpha,
      snorePuff: this.snorePuff ? { ...this.snorePuff } : null,
      questionMarkAlpha: this.questionMarkAlpha,
    };
  }

  reset(): void {
    this.state = 'DEEP_SLEEP';
    this.breathingPhase = 0;
    this.facingAngle = 0;
    this.sitUpProgress = 0;
    this.eyesOpenAmount = 0;
    this.headOffset = { x: 0, y: 0 };
    this.bodyOffset = { x: 0, y: 0 };
    this.mumbleText = null;
    this.mumbleAlpha = 0;
    this.mumbleTimer = 0;
    this.snorePuff = null;
    this.questionMarkAlpha = 0;
    this.activeEvent = null;
    this.scheduleNextEvent();
  }
}
