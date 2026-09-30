import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/constants';

export interface PostProcessOptions {
  caustics: boolean;
  bloom: boolean;
  vignette: boolean;
  grain: boolean;
  waterMotion: boolean;
}

export class WaterPostProcessSystem {
  private readonly caustics: Phaser.GameObjects.Graphics;
  private readonly vignette: Phaser.GameObjects.Graphics;
  private readonly grain: Phaser.GameObjects.Graphics;
  private readonly options: PostProcessOptions = {
    caustics: false,
    bloom: true,
    vignette: true,
    grain: true,
    waterMotion: true,
  };
  private time = 0;

  public constructor(scene: Phaser.Scene) {
    this.caustics = scene.add.graphics().setScrollFactor(0).setDepth(8);
    this.caustics.setBlendMode(Phaser.BlendModes.ADD);

    this.vignette = scene.add.graphics().setScrollFactor(0).setDepth(850);
    for (let inset = 0; inset < 36; inset += 6) {
      this.vignette.lineStyle(7, 0x001017, (1 - inset / 36) * 0.026);
      this.vignette.strokeRect(
        inset,
        inset,
        GAME_WIDTH - inset * 2,
        GAME_HEIGHT - inset * 2,
      );
    }

    this.grain = scene.add.graphics().setScrollFactor(0).setDepth(840);
    const random = new Phaser.Math.RandomDataGenerator(['abyssal-grain']);
    this.grain.fillStyle(0xd8ffff, 0.012);
    for (let index = 0; index < 110; index += 1) {
      this.grain.fillRect(
        random.between(0, GAME_WIDTH),
        random.between(0, GAME_HEIGHT),
        1,
        1,
      );
    }
  }

  public setOption<K extends keyof PostProcessOptions>(
    key: K,
    value: PostProcessOptions[K],
  ): void {
    this.options[key] = value;
  }

  public update(deltaMs: number, depth: number): void {
    this.time += Math.min(deltaMs / 1_000, 1 / 20);

    this.caustics.setVisible(this.options.caustics);
    this.vignette.setVisible(this.options.vignette);
    this.grain.setVisible(this.options.grain);

    if (this.options.caustics) {
      this.caustics.clear();
      const strength = (1 - depth) * 0.018;

      for (let index = 0; index < 5; index += 1) {
        const x =
          GAME_WIDTH * (0.12 + index * 0.2) +
          Math.sin(this.time * 0.18 + index) * 18;
        const y =
          GAME_HEIGHT * (0.22 + (index % 2) * 0.18) +
          Math.sin(this.time * 0.14 + index * 1.7) * 7;

        this.caustics.fillStyle(0xa4f1ea, strength);
        this.caustics.fillEllipse(x, y, 120, 20);
      }
    } else {
      this.caustics.clear();
    }

    if (this.options.waterMotion) {
      this.grain.x = Math.sin(this.time * 0.13) * 0.5;
      this.grain.y = Math.sin(this.time * 0.17) * 0.5;
    }

    this.vignette.setAlpha(0.18 + depth * 0.22);
    this.grain.setAlpha(0.06 + depth * 0.07);
  }
}
