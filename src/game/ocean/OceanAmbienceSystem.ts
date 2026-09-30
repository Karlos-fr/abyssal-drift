import { Math as PhaserMath } from 'phaser';
import type { Scene } from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';

interface HazePatch {
  shape: Phaser.GameObjects.Ellipse;
  baseX: number;
  baseY: number;
  phase: number;
}

export class OceanAmbienceSystem {
  private readonly haze: HazePatch[] = [];
  private timeSeconds = 0;

  public constructor(scene: Scene) {
    this.createBackgroundLayers(scene);
    this.createHaze(scene);
    this.createVegetation(scene);
    this.createFloatingDebris(scene);
  }

  public update(deltaMs: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    this.timeSeconds += deltaSeconds;

    for (const patch of this.haze) {
      patch.shape.x =
        patch.baseX + Math.sin(this.timeSeconds * 0.08 + patch.phase) * 18;
      patch.shape.y =
        patch.baseY + Math.sin(this.timeSeconds * 0.055 + patch.phase) * 7;
    }
  }

  private createBackgroundLayers(scene: Scene): void {
    const far = scene.add.graphics().setDepth(-92).setScrollFactor(0.35, 0.55);
    far.fillStyle(0x0a2630, 0.34);
    far.fillEllipse(250, 700, 520, 170);
    far.fillEllipse(760, 665, 610, 200);
    far.fillEllipse(1_330, 705, 570, 180);
    far.fillEllipse(1_780, 680, 470, 165);

    const mid = scene.add.graphics().setDepth(-82).setScrollFactor(0.58, 0.7);
    mid.fillStyle(0x08191f, 0.56);
    mid.fillEllipse(180, 765, 380, 125);
    mid.fillEllipse(600, 745, 460, 140);
    mid.fillEllipse(1_080, 760, 430, 145);
    mid.fillEllipse(1_540, 755, 470, 140);

    const near = scene.add.graphics().setDepth(-72).setScrollFactor(0.78, 0.86);
    near.fillStyle(0x071318, 0.66);
    near.fillEllipse(120, 825, 280, 88);
    near.fillEllipse(440, 817, 330, 96);
    near.fillEllipse(820, 830, 360, 100);
    near.fillEllipse(1_220, 820, 340, 92);
    near.fillEllipse(1_600, 833, 360, 100);
  }

  private createHaze(scene: Scene): void {
    const patches = [
      { x: 300, y: 320, w: 360, h: 130, a: 0.012, s: 0.5 },
      { x: 720, y: 430, w: 450, h: 160, a: 0.01, s: 0.64 },
      { x: 1_160, y: 340, w: 400, h: 145, a: 0.01, s: 0.58 },
      { x: 1_560, y: 500, w: 470, h: 170, a: 0.009, s: 0.72 },
    ];

    patches.forEach((patch, index) => {
      const shape = scene.add
        .ellipse(
          patch.x,
          patch.y,
          patch.w,
          patch.h,
          0x82b4b8,
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

      plants.lineStyle(random.between(1, 2), 0x1b5a54, 0.36);
      plants.beginPath();
      plants.moveTo(x, y);
      plants.lineTo(x + lean, y - height);
      plants.strokePath();
    }
  }

  private createFloatingDebris(scene: Scene): void {
    const random = new PhaserMath.RandomDataGenerator(['abyssal-debris']);

    for (let index = 0; index < 25; index += 1) {
      scene.add
        .rectangle(
          random.between(50, WORLD_WIDTH - 50),
          random.between(150, WORLD_HEIGHT - 100),
          random.realInRange(1.2, 3.0),
          random.realInRange(0.5, 1.0),
          0x78918d,
          random.realInRange(0.04, 0.10),
        )
        .setRotation(random.realInRange(-1.2, 1.2))
        .setScrollFactor(random.realInRange(0.78, 0.96))
        .setDepth(-45);
    }
  }
}
