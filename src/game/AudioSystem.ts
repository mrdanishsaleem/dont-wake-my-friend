import type { Room } from '../types';

/**
 * AudioSystem — complete procedural Web Audio API stealth synthesizer.
 * Provides rich sound feedback with zero external audio assets.
 */

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private footstepNoise: AudioBuffer | null = null;
  private lastHeartbeatTime: number = 0;

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  unlock(): void {
    if (!this.isMuted) this.initContext();
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.unlock();
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Soft footstep carpet/floor tap.
   */
  playFootstep(surface: Room['floorType'], sneaking: boolean): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      if (!this.footstepNoise) {
        this.footstepNoise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.085), ctx.sampleRate);
        const samples = this.footstepNoise.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      const contact = ctx.createBufferSource();
      contact.buffer = this.footstepNoise;
      contact.connect(filter);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(surface === 'tile' ? 2800 : surface === 'wood' ? 1700 : 1050, now);

      osc.type = 'triangle';
      const freq = (surface === 'tile' ? 175 : surface === 'wood' ? 142 : 110) + Math.random() * 18;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

      gain.gain.setValueAtTime((surface === 'carpet' ? 0.15 : 0.22) * (sneaking ? 0.4 : 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      contact.start(now);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio autoplay fallback
    }
  }

  /**
   * Subtle high crystal chime when picking up the water glass.
   */
  playPickupSound(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: High soft bell tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: Secondary water drop sparkle
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.25);

      gain2.gain.setValueAtTime(0.09, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.55);
    } catch {
      // Ignore
    }
  }

  /**
   * Heartbeat thud at extreme wake levels.
   */
  playHeartbeat(): void {
    if (this.isMuted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastHeartbeatTime < 800) return;
    this.lastHeartbeatTime = nowMs;

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Lub
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(65, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.08);

      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.1);

      // Dub
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(55, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.2);

      gain2.gain.setValueAtTime(0.09, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.12);
      osc2.stop(now + 0.23);
    } catch {
      // Ignore
    }
  }

  playDistractionImpact(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const tone = ctx.createOscillator();
    const gain = ctx.createGain();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(1450, now);
    tone.frequency.exponentialRampToValueAtTime(610, now + 0.09);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    tone.connect(gain);
    gain.connect(ctx.destination);
    tone.start(now);
    tone.stop(now + 0.13);
  }

  playAlarmBeep(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.setValueAtTime(988, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.26);
  }

  /**
   * Subtle alert tension sting.
   */
  playWarningSound(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.15);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore
    }
  }

  /**
   * Game over alert thud.
   */
  playGameOverSound(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {
      // Ignore
    }
  }

  /**
   * Ascending gentle melody when completing a mission.
   */
  playSuccessSound(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + i * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.4);
      });
    } catch {
      // Ignore
    }
  }
}

export const sound = new AudioSystem();
