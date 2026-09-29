import Phaser from 'phaser';

interface ImpactParticle {
  sprite: Phaser.GameObjects.Rectangle;
  active: boolean;
  velocityX: number;
  velocityY: number;
  age: number;
  lifetime: number;
}

interface Spark {
  sprite: Phaser.GameObjects.Rectangle;
  active: boolean;
  velocityX: number;
  velocityY: number;
  age: number;
  lifetime: number;
}

const PARTICLE_COUNT = 18;
const SPARK_COUNT = 10;
const SPARK_THRESHOLD = 0.72;

export class ImpactEffectSystem {
  private readonly particles: ImpactParticle[] = [];
  private readonly sparks: Spark[] = [];
  private readonly flash: Phaser.GameObjects.Arc;

  public constructor(scene: Phaser.Scene) {
    this.flash = scene.add
      .circle(0, 0, 7, 0xeaffff, 0)
      .setDepth(45)
      .setVisible(false);
    this.flash.setBlendMode(Phaser.BlendModes.ADD);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const sprite = scene.add
        .rectangle(0, 0, 1.5, 1, 0x9bc7ca, 0.55)
        .setDepth(44)
        .setVisible(false);

      this.particles.push({
        sprite,
        active: false,
        velocityX: 0,
        velocityY: 0,
        age: 0,
        lifetime: 0,
      });
    }

    for (let index = 0; index < SPARK_COUNT; index += 1) {
      const sprite = scene.add
        .rectangle(0, 0, 3.5, 0.7, 0xffd78a, 0.9)
        .setDepth(46)
        .setVisible(false);
      sprite.setBlendMode(Phaser.BlendModes.ADD);

      this.sparks.push({
        sprite,
        active: false,
        velocityX: 0,
        velocityY: 0,
        age: 0,
        lifetime: 0,
      });
    }
  }

  public trigger(
    x: number,
    y: number,
    impactStrength: number,
    hitHorizontal: boolean,
    hitVertical: boolean,
  ): void {
    const strength = Phaser.Math.Clamp(impactStrength / 72, 0.15, 1);
    const count = Math.round(2 + strength * 5);

    this.flash
      .setPosition(x, y)
      .setScale(0.7 + strength * 0.8)
      .setAlpha(0.22 + strength * 0.42)
      .setVisible(true);

    this.emitDebris(x, y, strength, count, hitHorizontal, hitVertical);

    // Sparks are intentionally rare: only hard metal-on-rock impacts get them.
    if (strength >= SPARK_THRESHOLD) {
      this.emitSparks(x, y, strength, hitHorizontal, hitVertical);
    }
  }

  public update(deltaMs: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);

    if (this.flash.visible) {
      const nextAlpha = Math.max(0, this.flash.alpha - deltaSeconds * 5.5);
      this.flash.setAlpha(nextAlpha);
      this.flash.setScale(this.flash.scaleX + deltaSeconds * 2.8);

      if (nextAlpha <= 0) {
        this.flash.setVisible(false);
      }
    }

    for (const particle of this.particles) {
      if (!particle.active) {
        continue;
      }

      particle.age += deltaSeconds;
      if (particle.age >= particle.lifetime) {
        particle.active = false;
        particle.sprite.setVisible(false);
        continue;
      }

      particle.sprite.x += particle.velocityX * deltaSeconds;
      particle.sprite.y += particle.velocityY * deltaSeconds;
      particle.velocityY += 18 * deltaSeconds;

      const life = particle.age / particle.lifetime;
      particle.sprite
        .setAlpha((1 - life) * 0.8)
        .setScale(1 - life * 0.45);
    }

    for (const spark of this.sparks) {
      if (!spark.active) {
        continue;
      }

      spark.age += deltaSeconds;
      if (spark.age >= spark.lifetime) {
        spark.active = false;
        spark.sprite.setVisible(false);
        continue;
      }

      spark.sprite.x += spark.velocityX * deltaSeconds;
      spark.sprite.y += spark.velocityY * deltaSeconds;
      spark.velocityX *= Math.exp(-5 * deltaSeconds);
      spark.velocityY *= Math.exp(-5 * deltaSeconds);

      const life = spark.age / spark.lifetime;
      spark.sprite.setAlpha((1 - life) * 0.9);
    }
  }

  private emitDebris(
    x: number,
    y: number,
    strength: number,
    count: number,
    hitHorizontal: boolean,
    hitVertical: boolean,
  ): void {
    let emitted = 0;
    for (const particle of this.particles) {
      if (particle.active) {
        continue;
      }

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(9, 18 + strength * 22);
      const normalBiasX = hitHorizontal ? Phaser.Math.RND.sign() * 8 : 0;
      const normalBiasY = hitVertical ? Phaser.Math.RND.sign() * 8 : 0;

      particle.active = true;
      particle.age = 0;
      particle.lifetime = Phaser.Math.FloatBetween(0.18, 0.42);
      particle.velocityX = Math.cos(angle) * speed + normalBiasX;
      particle.velocityY = Math.sin(angle) * speed + normalBiasY;
      particle.sprite
        .setPosition(
          x + Phaser.Math.FloatBetween(-6, 6),
          y + Phaser.Math.FloatBetween(-4, 4),
        )
        .setRotation(angle)
        .setScale(0.7 + strength * 0.8)
        .setAlpha(0.25 + strength * 0.35)
        .setVisible(true);

      emitted += 1;
      if (emitted >= count) {
        break;
      }
    }
  }

  private emitSparks(
    x: number,
    y: number,
    strength: number,
    hitHorizontal: boolean,
    hitVertical: boolean,
  ): void {
    const count = Math.round(2 + strength * 4);
    let emitted = 0;

    for (const spark of this.sparks) {
      if (spark.active) {
        continue;
      }

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const normalX = hitHorizontal ? Phaser.Math.RND.sign() * 25 : 0;
      const normalY = hitVertical ? Phaser.Math.RND.sign() * 25 : 0;
      const speed = Phaser.Math.FloatBetween(24, 48);

      spark.active = true;
      spark.age = 0;
      spark.lifetime = Phaser.Math.FloatBetween(0.08, 0.18);
      spark.velocityX = Math.cos(angle) * speed + normalX;
      spark.velocityY = Math.sin(angle) * speed + normalY;
      spark.sprite
        .setPosition(x, y)
        .setRotation(angle)
        .setAlpha(0.75 + strength * 0.2)
        .setVisible(true);

      emitted += 1;
      if (emitted >= count) {
        break;
      }
    }
  }
}
