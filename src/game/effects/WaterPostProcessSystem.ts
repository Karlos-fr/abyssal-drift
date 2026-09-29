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
    caustics: true,
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
    for (let inset = 0; inset < 30; inset += 5) {
      this.vignette.lineStyle(6, 0x001017, (1 - inset / 30) * 0.045);
      this.vignette.strokeRect(
        inset,
        inset,
        GAME_WIDTH - inset * 2,
        GAME_HEIGHT - inset * 2,
      );
    }

    this.grain = scene.add.graphics().setScrollFactor(0).setDepth(840);
    const random = new Phaser.Math.RandomDataGenerator(['abyssal-grain']);
    this.grain.fillStyle(0xd8ffff, 0.035);
    for (let i = 0; i < 120; i += 1) {
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
      const surfaceStrength = (1 - depth) * 0.055;
      this.caustics.lineStyle(1, 0xa4f1ea, surfaceStrength);
      for (let y = 30; y < GAME_HEIGHT; y += 34) {
        this.caustics.beginPath();
        for (let x = -20; x <= GAME_WIDTH + 20; x += 16) {
          const wave =
            Math.sin(x * 0.045 + this.time * 0.7 + y * 0.03) * 3 +
            Math.sin(x * 0.018 - this.time * 0.35) * 2;
          if (x === -20) this.caustics.moveTo(x, y + wave);
          else this.caustics.lineTo(x, y + wave);
        }
        this.caustics.strokePath();
      }
    }

    if (this.options.waterMotion) {
      this.caustics.x = Math.sin(this.time * 0.22) * 2;
      this.caustics.y = Math.sin(this.time * 0.31) * 1.2;
    }

    this.vignette.setAlpha(0.45 + depth * 0.5);
    this.grain.setAlpha(0.2 + depth * 0.18);
  }
}
