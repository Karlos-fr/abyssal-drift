import type Phaser from 'phaser';

export class SubmarineEffects {
  public constructor(
    private readonly vessel: Phaser.GameObjects.Container,
    private readonly headlightHalo: Phaser.GameObjects.Arc,
  ) {}

  public update(speedRatio: number, timeSeconds: number): void {
    const vibration = speedRatio * Math.sin(timeSeconds * 32) * 0.35;
    this.vessel.setScale(this.vessel.scaleX, 1 + vibration * 0.002);

    const flicker =
      Math.sin(timeSeconds * 11.7) * 0.018 +
      Math.sin(timeSeconds * 23.3) * 0.009;
    this.headlightHalo.setAlpha(0.11 + flicker);
  }
}
