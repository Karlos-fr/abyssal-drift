import Phaser from 'phaser';

interface SonarTarget {
  marker: Phaser.GameObjects.Arc;
  reveal: number;
  hitThisPulse: boolean;
}

const PULSE_DURATION = 1.05;
const PULSE_RADIUS = 185;
const COOLDOWN = 1.35;

export class SonarSystem {
  private readonly wave: Phaser.GameObjects.Graphics;
  private readonly originFlash: Phaser.GameObjects.Arc;
  private readonly echoGlow: Phaser.GameObjects.Arc;
  private readonly targets: SonarTarget[];
  private active = false;
  private age = 0;
  private cooldown = 0;
  private originX = 0;
  private originY = 0;

  public constructor(scene: Phaser.Scene) {
    this.wave = scene.add.graphics().setDepth(40);
    this.wave.setBlendMode(Phaser.BlendModes.ADD);

    this.originFlash = scene.add
      .circle(0, 0, 4, 0x8ffcff, 0.5)
      .setDepth(39)
      .setVisible(false);
    this.originFlash.setBlendMode(Phaser.BlendModes.ADD);

    // A large additive disc creates a cheap post-process-like bloom around the
    // expanding ping. It works on WebGL and Canvas, so mobile keeps a fallback.
    this.echoGlow = scene.add
      .circle(0, 0, 1, 0x65e8e3, 0)
      .setDepth(38)
      .setVisible(false);
    this.echoGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.targets = [
      this.createTarget(scene, 955, 430),
      this.createTarget(scene, 1_385, 405),
      this.createTarget(scene, 1_785, 545),
    ];
  }

  public trigger(x: number, y: number): boolean {
    if (this.cooldown > 0) {
      return false;
    }

    this.active = true;
    this.age = 0;
    this.cooldown = COOLDOWN;
    this.originX = x;
    this.originY = y;

    for (const target of this.targets) {
      target.hitThisPulse = false;
    }

    this.originFlash
      .setPosition(x, y)
      .setScale(0.7)
      .setAlpha(0.7)
      .setVisible(true);

    this.echoGlow
      .setPosition(x, y)
      .setScale(1)
      .setAlpha(0.11)
      .setVisible(true);

    return true;
  }

  public update(deltaMs: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds);

    for (const target of this.targets) {
      target.reveal = Math.max(0, target.reveal - deltaSeconds * 0.55);
      const shimmer =
        target.reveal > 0
          ? 1 + Math.sin(target.reveal * 18) * 0.08
          : 1;
      target.marker
        .setAlpha(0.025 + target.reveal * 0.85)
        .setScale(shimmer);
    }

    if (!this.active) {
      return;
    }

    this.age += deltaSeconds;
    const progress = Phaser.Math.Clamp(this.age / PULSE_DURATION, 0, 1);
    const radius = Phaser.Math.Easing.Cubic.Out(progress) * PULSE_RADIUS;

    this.wave.clear();
    this.wave.lineStyle(2, 0x78f5eb, (1 - progress) * 0.65);
    this.wave.strokeCircle(this.originX, this.originY, radius);
    this.wave.lineStyle(1, 0xd9ffff, (1 - progress) * 0.25);
    this.wave.strokeCircle(
      this.originX,
      this.originY,
      Math.max(0, radius - 5),
    );

    const flashProgress = Math.min(1, progress * 4);
    this.originFlash
      .setScale(0.7 + flashProgress * 2.2)
      .setAlpha((1 - flashProgress) * 0.65);

    this.echoGlow
      .setScale(Math.max(1, radius))
      .setAlpha((1 - progress) * 0.055);

    this.revealReachedTargets(radius);

    if (progress >= 1) {
      this.active = false;
      this.wave.clear();
      this.originFlash.setVisible(false);
      this.echoGlow.setVisible(false);
    }
  }

  private revealReachedTargets(radius: number): void {
    for (const target of this.targets) {
      if (target.hitThisPulse) {
        continue;
      }

      const dx = target.marker.x - this.originX;
      const dy = target.marker.y - this.originY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        target.hitThisPulse = true;
        target.reveal = 1;
      }
    }
  }

  private createTarget(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ): SonarTarget {
    const marker = scene.add
      .circle(x, y, 5, 0x6ce8dc, 0.03)
      .setStrokeStyle(1, 0x8ffcff, 0.55)
      .setAlpha(0.025)
      .setDepth(9);
    marker.setBlendMode(Phaser.BlendModes.ADD);

    return {
      marker,
      reveal: 0,
      hitThisPulse: false,
    };
  }
}
