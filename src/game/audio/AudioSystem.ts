import Phaser from 'phaser';
import type { SubmarineMotion } from '../submarine/SubmarinePhysics';

const MAX_HORIZONTAL_SPEED = 72;
const MAX_VERTICAL_SPEED = 48;

export class AudioSystem {
  private context: AudioContext | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private rumbleOscillator: OscillatorNode | null = null;
  private rumbleGain: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private depth = 0;
  private creakTimer = 0;
  private distantTimer = 0;
  private ambienceGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private uiGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  public unlock(): void {
    const context = this.ensureContext();
    this.resume(context);
    this.ensureMix(context);
    this.ensureEngine(context);
    this.ensureDepthAmbience(context);
  }

  public updateEngine(motion: SubmarineMotion, depth = this.depth): void {
    this.depth = Phaser.Math.Clamp(depth, 0, 1);

    const speed = Phaser.Math.Clamp(
      Math.abs(motion.velocityX) / MAX_HORIZONTAL_SPEED * 0.75 +
        Math.abs(motion.velocityY) / MAX_VERTICAL_SPEED * 0.25,
      0,
      1,
    );

    if (speed < 0.015 && !this.context) {
      return;
    }

    const context = this.ensureContext();
    this.resume(context);
    this.ensureEngine(context);
    this.ensureDepthAmbience(context);

    const now = context.currentTime;
    const frequency = (48 + speed * 34) * (1 - this.depth * 0.12);
    const gain = 0.012 + speed * 0.032;
    const cutoff = (180 + speed * 260) * (1 - this.depth * 0.52);

    this.engineOscillator?.frequency.setTargetAtTime(frequency, now, 0.045);
    this.engineGain?.gain.setTargetAtTime(gain, now, 0.08);
    this.engineFilter?.frequency.setTargetAtTime(
      Math.max(95, cutoff),
      now,
      0.12,
    );

    this.rumbleGain?.gain.setTargetAtTime(
      0.002 + this.depth * this.depth * 0.026,
      now,
      0.3,
    );
    this.rumbleOscillator?.frequency.setTargetAtTime(
      31 - this.depth * 7,
      now,
      0.4,
    );
    this.ambienceFilter?.frequency.setTargetAtTime(
      720 - this.depth * 470,
      now,
      0.25,
    );
  }

  public updateDepth(deltaMs: number, depth: number): void {
    this.depth = Phaser.Math.Clamp(depth, 0, 1);
    this.distantTimer -= deltaMs / 1_000;

    if (this.context && this.distantTimer <= 0) {
      this.playDistantSound();
      this.distantTimer = Phaser.Math.FloatBetween(8, 16);
    }
    if (!this.context || this.depth < 0.58) {
      this.creakTimer = Math.max(0, this.creakTimer - deltaMs / 1_000);
      return;
    }

    this.creakTimer -= deltaMs / 1_000;
    if (this.creakTimer > 0) {
      return;
    }

    const pressure = Phaser.Math.Clamp((this.depth - 0.58) / 0.42, 0, 1);
    this.playHullCreak(pressure);
    this.creakTimer = Phaser.Math.FloatBetween(
      3.8 - pressure * 2.4,
      7.5 - pressure * 4.2,
    );
  }

  public playSonar(depth = this.depth): void {
    const context = this.ensureContext();
    this.resume(context);

    const d = Phaser.Math.Clamp(depth, 0, 1);
    const now = context.currentTime;
    const base = 760 - d * 190;
    this.playPing(context, now, base, 0.065, 0.42 + d * 0.16);
    this.playPing(
      context,
      now + 0.2 + d * 0.08,
      base * 0.71,
      0.026 + d * 0.008,
      0.46 + d * 0.2,
    );
  }

  public playImpact(impactStrength: number): void {
    const context = this.ensureContext();
    this.resume(context);

    const strength = Phaser.Math.Clamp(
      impactStrength / MAX_HORIZONTAL_SPEED,
      0,
      1,
    );
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(
      260 + strength * 260,
      context.currentTime,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      75,
      context.currentTime + 0.14,
    );

    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.linearRampToValueAtTime(
      0.025 + strength * 0.055,
      context.currentTime + 0.008,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + 0.16,
    );

    oscillator.connect(gain);
    gain.connect(this.effectsGain ?? context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.17);
  }

  public dispose(): void {
    if (!this.context) {
      return;
    }

    this.engineOscillator?.stop();
    this.rumbleOscillator?.stop();
    void this.context.close();

    this.context = null;
    this.engineOscillator = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.rumbleOscillator = null;
    this.rumbleGain = null;
    this.ambienceFilter = null;
    this.ambienceGain = null;
    this.effectsGain = null;
    this.uiGain = null;
    this.musicGain = null;
    this.masterGain = null;
  }

  public playBallast(intensity: number): void {
    const context = this.ensureContext();
    this.resume(context);
    this.ensureMix(context);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 58 + Math.abs(intensity) * 22;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.018, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(this.effectsGain ?? context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  }

  public playDetection(): void {
    const context = this.ensureContext();
    this.resume(context);
    this.ensureMix(context);
    this.playPing(context, context.currentTime, 1040, 0.022, 0.18);
  }

  public setMasterVolume(value: number): void {
    if (!this.context) return;
    this.masterGain?.gain.setTargetAtTime(
      Phaser.Math.Clamp(value, 0, 1),
      this.context.currentTime,
      0.05,
    );
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
    }

    return this.context;
  }

  private resume(context: AudioContext): void {
    if (context.state === 'suspended') {
      void context.resume();
    }
  }

  private ensureMix(context: AudioContext): void {
    if (
      this.masterGain &&
      this.ambienceGain &&
      this.effectsGain &&
      this.uiGain &&
      this.musicGain
    ) {
      return;
    }

    const master = context.createGain();
    const ambience = context.createGain();
    const effects = context.createGain();
    const ui = context.createGain();
    const music = context.createGain();
    master.gain.value = 0.85;
    ambience.gain.value = 0.75;
    effects.gain.value = 0.9;
    ui.gain.value = 0.8;
    music.gain.value = 0.7;
    ambience.connect(master);
    effects.connect(master);
    ui.connect(master);
    music.connect(master);
    master.connect(context.destination);
    this.masterGain = master;
    this.ambienceGain = ambience;
    this.effectsGain = effects;
    this.uiGain = ui;
    this.musicGain = music;
  }

  private ensureEngine(context: AudioContext): void {
    if (this.engineOscillator && this.engineGain && this.engineFilter) {
      return;
    }

    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 48;
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 1.3;
    gain.gain.value = 0.012;

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain ?? context.destination);
    oscillator.start();

    this.engineOscillator = oscillator;
    this.engineFilter = filter;
    this.engineGain = gain;
  }

  private ensureDepthAmbience(context: AudioContext): void {
    if (this.rumbleOscillator && this.rumbleGain && this.ambienceFilter) {
      return;
    }

    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 31;
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    filter.Q.value = 0.7;
    gain.gain.value = 0.002;

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain ?? context.destination);
    oscillator.start();

    this.rumbleOscillator = oscillator;
    this.rumbleGain = gain;
    this.ambienceFilter = filter;
  }

  private playHullCreak(pressure: number): void {
    if (!this.context) {
      return;
    }

    const context = this.context;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(95 + pressure * 38, now);
    oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.28);
    filter.type = 'lowpass';
    filter.frequency.value = 190;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.012 + pressure * 0.026, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsGain ?? context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.35);
  }

  private playDistantSound(): void {
    if (!this.context) return;
    const context = this.context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = Phaser.Math.FloatBetween(45, 72);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.006, context.currentTime + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.8);
    oscillator.connect(gain);
    gain.connect(this.ambienceGain ?? context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 1.85);
  }

  private playPing(
    context: AudioContext,
    startTime: number,
    frequency: number,
    volume: number,
    duration: number,
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.78,
      startTime + duration * 0.76,
    );

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + duration,
    );

    oscillator.connect(gain);
    gain.connect(this.effectsGain ?? context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }
}
