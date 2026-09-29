import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';

interface LightRay {
  shape: Phaser.GameObjects.Graphics;
  baseAlpha: number;
  phase: number;
  speed: number;
}

export class OceanAmbienceSystem {
  private readonly rays: LightRay[] = [];
  private timeSeconds = 0;

  public constructor(scene: Phaser.Scene) {
    this.createBackgroundLayers(scene);
    this.createVegetation(scene);
    this.createFloatingDebris(scene);
    this.createSurfaceRays(scene);
  }

  public update(deltaMs: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    this.timeSeconds += deltaSeconds;

    for (const ray of this.rays) {
      const pulse = Math.sin(this.timeSeconds * ray.speed + ray.phase);
      ray.shape.setAlpha(ray.baseAlpha * (0.78 + pulse * 0.22));
      ray.shape.x = Math.sin(this.timeSeconds * 0.12 + ray.phase) * 8;
    }
  }

  private createBackgroundLayers(scene: Phaser.Scene): void {
    const far = scene.add.graphics().setDepth(-92).setScrollFactor(0.35, 0.55);
    far.fillStyle(0x062731, 0.5);
    for (let x = -100; x < WORLD_WIDTH + 200; x += 180) {
      const peak = 360 + ((x / 180) % 3) * 45;
      far.fillTriangle(x, WORLD_HEIGHT, x + 90, peak, x + 210, WORLD_HEIGHT);
    }

    const mid = scene.add.graphics().setDepth(-82).setScrollFactor(0.62, 0.72);
    mid.fillStyle(0x082129, 0.72);
    for (let x = -80; x < WORLD_WIDTH + 180; x += 125) {
      const peak = 490 + ((x / 125) % 4) * 34;
      mid.fillTriangle(x, WORLD_HEIGHT, x + 54, peak, x + 150, WORLD_HEIGHT);
    }

    const near = scene.add.graphics().setDepth(-72).setScrollFactor(0.82, 0.88);
    near.fillStyle(0x0a1b21, 0.62);
    for (let x = -40; x < WORLD_WIDTH + 100; x += 94) {
      near.fillTriangle(x, WORLD_HEIGHT, x + 35, 650, x + 108, WORLD_HEIGHT);
    }
  }

  private createVegetation(scene: Phaser.Scene): void {
    const plants = scene.add.graphics().setDepth(-8);
    const random = new Phaser.Math.RandomDataGenerator(['abyssal-plants']);

    for (let index = 0; index < 52; index += 1) {
      const x = random.between(70, WORLD_WIDTH - 70);
      const y = WORLD_HEIGHT - random.between(60, 88);
      const height = random.between(8, 25);
      const lean = random.between(-5, 5);

      plants.lineStyle(random.between(1, 2), 0x1b5a54, 0.52);
      plants.beginPath();
      plants.moveTo(x, y);
      plants.lineTo(x + lean, y - height);
      plants.strokePath();

      if (index % 3 === 0) {
        plants.fillStyle(0x267267, 0.34);
        plants.fillEllipse(x + lean - 2, y - height * 0.65, 5, 2.5);
      }
    }
  }

  private createFloatingDebris(scene: Phaser.Scene): void {
    const random = new Phaser.Math.RandomDataGenerator(['abyssal-debris']);

    for (let index = 0; index < 34; index += 1) {
      const width = random.realInRange(1.5, 4);
      const height = random.realInRange(0.5, 1.4);
      scene.add
        .rectangle(
          random.between(50, WORLD_WIDTH - 50),
          random.between(100, WORLD_HEIGHT - 100),
          width,
          height,
          0x6f8c83,
          random.realInRange(0.08, 0.18),
        )
        .setRotation(random.realInRange(-1.2, 1.2))
        .setScrollFactor(random.realInRange(0.78, 0.96))
        .setDepth(-45);
    }
  }

  private createSurfaceRays(scene: Phaser.Scene): void {
    const starts = [40, 150, 275, 390, 520, 680, 840, 1030, 1240, 1480, 1710];

    starts.forEach((x, index) => {
      const ray = scene.add.graphics().setDepth(-60).setScrollFactor(0.72, 0.9);
      const width = 42 + (index % 3) * 18;
      ray.fillStyle(0x9de8e5, 1);
      ray.fillTriangle(x, 58, x + width, 58, x + width * 2.15, 430);
      ray.setBlendMode(Phaser.BlendModes.ADD);

      const baseAlpha = 0.025 + (index % 4) * 0.008;
      ray.setAlpha(baseAlpha);
      this.rays.push({
        shape: ray,
        baseAlpha,
        phase: index * 0.83,
        speed: 0.34 + (index % 3) * 0.09,
      });
    });
  }
}
