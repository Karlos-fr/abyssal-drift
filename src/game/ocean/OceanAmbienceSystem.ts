import { BlendModes, Math as PhaserMath } from 'phaser';
import type { GameObjects, Scene } from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';

interface LightRay {
  shape: GameObjects.Graphics;
  baseAlpha: number;
  phase: number;
  speed: number;
}

interface HazePatch {
  shape: GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  phase: number;
}

export class OceanAmbienceSystem {
  private readonly rays: LightRay[] = [];
  private readonly haze: HazePatch[] = [];
  private timeSeconds = 0;

  public constructor(scene: Scene) {
    this.createBackgroundLayers(scene);
    this.createHaze(scene);
    this.createVegetation(scene);
    this.createFloatingDebris(scene);
    this.createSurfaceRays(scene);
  }

  public update(deltaMs: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    this.timeSeconds += deltaSeconds;

    for (const ray of this.rays) {
      const pulse = Math.sin(this.timeSeconds * ray.speed + ray.phase);
      ray.shape.setAlpha(ray.baseAlpha * (0.86 + pulse * 0.14));
      ray.shape.x = Math.sin(this.timeSeconds * 0.08 + ray.phase) * 5;
    }

    for (const patch of this.haze) {
      patch.shape.x =
        patch.baseX + Math.sin(this.timeSeconds * 0.08 + patch.phase) * 18;
      patch.shape.y =
        patch.baseY + Math.sin(this.timeSeconds * 0.055 + patch.phase) * 7;
    }
  }

  private createBackgroundLayers(scene: Scene): void {
    const far = scene.add.graphics().setDepth(-92).setScrollFactor(0.35, 0.55);
    far.fillStyle(0x051c25, 0.42);
    far.fillEllipse(250, 690, 520, 180);
    far.fillEllipse(760, 655, 610, 210);
    far.fillEllipse(1_330, 690, 570, 190);
    far.fillEllipse(1_780, 670, 470, 170);

    const mid = scene.add.graphics().setDepth(-82).setScrollFactor(0.58, 0.7);
    mid.fillStyle(0x07171d, 0.62);
    mid.fillEllipse(180, 760, 380, 130);
    mid.fillEllipse(600, 742, 460, 145);
    mid.fillEllipse(1_080, 755, 430, 150);
    mid.fillEllipse(1_540, 750, 470, 145);
    mid.fillEllipse(1_860, 760, 280, 120);

    const near = scene.add.graphics().setDepth(-72).setScrollFactor(0.78, 0.86);
    near.fillStyle(0x081319, 0.7);
    near.fillEllipse(120, 820, 280, 90);
    near.fillEllipse(440, 812, 330, 100);
    near.fillEllipse(820, 825, 360, 105);
    near.fillEllipse(1_220, 815, 340, 95);
    near.fillEllipse(1_600, 828, 360, 105);
    near.fillEllipse(1_880, 818, 260, 90);
  }

  private createHaze(scene: Scene): void {
    const patches = [
      { x: 230, y: 220, w: 340, h: 130, a: 0.022, s: 0.5 },
      { x: 640, y: 360, w: 430, h: 160, a: 0.018, s: 0.64 },
      { x: 1_060, y: 250, w: 390, h: 145, a: 0.018, s: 0.58 },
      { x: 1_470, y: 420, w: 460, h: 170, a: 0.015, s: 0.72 },
      { x: 1_780, y: 300, w: 320, h: 120, a: 0.017, s: 0.62 },
    ];

    patches.forEach((patch, index) => {
      const shape = scene.add
        .ellipse(
          patch.x,
          patch.y,
          patch.w,
          patch.h,
          0x6fa8ae,
          patch.a,
        )
        .setDepth(-68)
        .setScrollFactor(patch.s);

      this.haze.push({
        shape,
        baseX: patch.x,
        baseY: patch.y,
        phase: index * 1.37,
      });
    });
  }

  private createVegetation(scene: Scene): void {
    const plants = scene.add.graphics().setDepth(-8);
    const random = new PhaserMath.RandomDataGenerator(['abyssal-plants']);

    for (let index = 0; index < 48; index += 1) {
      const x = random.between(70, WORLD_WIDTH - 70);
      const y = WORLD_HEIGHT - random.between(60, 86);
      const height = random.between(7, 22);
      const lean = random.between(-4, 4);

      plants.lineStyle(random.between(1, 2), 0x1b5a54, 0.42);
      plants.beginPath();
      plants.moveTo(x, y);
      plants.lineTo(x + lean, y - height);
      plants.strokePath();

      if (index % 4 === 0) {
        plants.fillStyle(0x267267, 0.24);
        plants.fillEllipse(x + lean - 2, y - height * 0.65, 5, 2.5);
      }
    }
  }

  private createFloatingDebris(scene: Scene): void {
    const random = new PhaserMath.RandomDataGenerator(['abyssal-debris']);

    for (let index = 0; index < 28; index += 1) {
      scene.add
        .rectangle(
          random.between(50, WORLD_WIDTH - 50),
          random.between(100, WORLD_HEIGHT - 100),
          random.realInRange(1.2, 3.2),
          random.realInRange(0.5, 1.1),
          0x6f8c83,
          random.realInRange(0.05, 0.12),
        )
        .setRotation(random.realInRange(-1.2, 1.2))
        .setScrollFactor(random.realInRange(0.78, 0.96))
        .setDepth(-45);
    }
  }

  private createSurfaceRays(scene: Scene): void {
    const starts = [180, 690, 1_210, 1_690];

    starts.forEach((x, index) => {
      const ray = scene.add.graphics().setDepth(-60).setScrollFactor(0.8, 0.9);

      ray.fillStyle(0xb4f0ed, 1);
      ray.beginPath();
      ray.moveTo(x - 45, 58);
      ray.lineTo(x + 45, 58);
      ray.lineTo(x + 125, 430);
      ray.lineTo(x - 110, 430);
      ray.closePath();
      ray.fillPath();
      ray.setBlendMode(BlendModes.ADD);

      const baseAlpha = 0.012 + index * 0.003;
      ray.setAlpha(baseAlpha);

      this.rays.push({
        shape: ray,
        baseAlpha,
        phase: index * 1.2,
        speed: 0.16 + index * 0.025,
      });
    });
  }
}
