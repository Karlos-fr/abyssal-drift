import type Phaser from 'phaser';

export class SubmarineEffects {
  public constructor(private readonly vessel: Phaser.GameObjects.Container) {}

  public update(speedRatio: number, timeSeconds: number): void {
    const vibration = speedRatio * Math.sin(timeSeconds * 32) * 0.35;
    this.vessel.setScale(this.vessel.scaleX, 1 + vibration * 0.002);
  }
}
