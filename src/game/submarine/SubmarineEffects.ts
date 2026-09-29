import type Phaser from 'phaser';

export class SubmarineEffects {
  public constructor(
    private readonly vessel: Phaser.GameObjects.Container,
    private readonly headlightBeam: Phaser.GameObjects.Graphics,
    private readonly headlightHalo: Phaser.GameObjects.Arc,
  ) {}

  public update(speedRatio: number, timeSeconds: number): void {
    const vibration = speedRatio * Math.sin(timeSeconds * 32) * 0.35;
    this.vessel.setScale(this.vessel.scaleX, 1 + vibration * 0.002);

    const beamDrift = Math.sin(timeSeconds * 0.85) * 0.006;
    const flicker =
      Math.sin(timeSeconds * 11.7) * 0.025 +
      Math.sin(timeSeconds * 23.3) * 0.012;

    this.headlightBeam
      .setRotation(beamDrift)
      .setAlpha(0.9 + flicker);
    this.headlightHalo.setAlpha(0.14 + flicker * 0.8);
  }
}
