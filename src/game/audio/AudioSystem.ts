import Phaser from 'phaser';
import type { SubmarineMotion } from '../submarine/SubmarinePhysics';

const MAX_HORIZONTAL_SPEED = 72;
const MAX_VERTICAL_SPEED = 48;

/**
 * Small procedural Web Audio layer for the prototype.
 *
 * It deliberately avoids temporary sound assets. Final production audio can
 * replace these oscillators later without changing gameplay systems.
 */
export class AudioSystem {
  private context: AudioContext | null = null;
  private engineOscillator: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  public unlock(): void {
    const context = this.ensureContext();
    this.resume(context);
    this.ensureEngine(context);
  }

  public updateEngine(motion: SubmarineMotion): void {
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

    const now = context.currentTime;
    const frequency = 48 + speed * 34;
    const gain = 0.012 + speed * 0.032;
    const cutoff = 180 + speed * 260;

    this.engineOscillator?.frequency.setTargetAtTime(
      frequency,
      now,
      0.045,
    );
    this.engineGain?.gain.setTargetAtTime(gain, now, 0.08);
    this.engineFilter?.frequency.setTargetAtTime(cutoff, now, 0.08);
  }

  public playSonar(): void {
    const context = this.ensureContext();
    this.resume(context);

    const now = context.currentTime;
    this.playPing(context, now, 760, 0.065);
    this.playPing(context, now + 0.2, 540, 0.026);
  }

  public playImpact(impactStrength: number): void {
    const context = this.ensureContext();
    this.resume(context);

    const strength = Phaser.Math.Clamp(impactStrength / MAX_HORIZONTAL_SPEED, 0, 1);
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(260 + strength * 260, context.currentTime);
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
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.17);
  }

  public dispose(): void {
    if (!this.context) {
      return;
    }

    this.engineOscillator?.stop();
    void this.context.close();

    this.context = null;
    this.engineOscillator = null;
    this.engineGain = null;
    this.engineFilter = null;
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
    gain.connect(context.destination);
    oscillator.start();

    this.engineOscillator = oscillator;
    this.engineFilter = filter;
    this.engineGain = gain;
  }

  private playPing(
    context: AudioContext,
    startTime: number,
    frequency: number,
    volume: number,
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.78,
      startTime + 0.32,
    );

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.42);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.44);
  }
}
