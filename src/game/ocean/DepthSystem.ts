import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, WORLD_HEIGHT } from '../core/constants';

export class DepthSystem {
  private readonly haze: Phaser.GameObjects.Rectangle;
  private normalizedDepth = 0;

  public constructor(scene: Phaser.Scene) {
    this.haze = scene.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x00111f,
        0,
      )
      .setScrollFactor(0)
      .setDepth(5);
  }

  public get depth(): number {
    return this.normalizedDepth;
  }

  public update(worldY: number): void {
    this.normalizedDepth = Phaser.Math.Clamp(
      (worldY - 70) / (WORLD_HEIGHT - 140),
      0,
      1,
    );

    const eased = Phaser.Math.Easing.Sine.InOut(this.normalizedDepth);
    this.haze.setAlpha(0.03 + eased * 0.34);
  }
}
