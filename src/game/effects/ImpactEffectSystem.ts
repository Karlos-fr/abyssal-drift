import Phaser from 'phaser';

interface ImpactParticle {
  sprite: Phaser.GameObjects.Rectangle;
  active: boolean;
  velocityX: number;
  velocityY: number;
  age: number;
  lifetime: number;
}

const PARTICLE_COUNT = 28;

export class ImpactEffectSystem {
  private readonly particles: ImpactParticle[] = [];
  private readonly flash: Phaser.GameObjects.Arc;

  public constructor(scene: Phaser.Scene) {
    this.flash = scene.add
      .circle(0, 0, 7, 0xeaffff, 0)
      .setDepth(45)
      .setVisible(false);
    this.flash.setBlendMode(Phaser.BlendModes.ADD);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const sprite = scene.add
        .rectangle(0, 0, 2, 1, 0xb8d6d2, 0.8)
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
  }

  public trigger(
    x: number,
    y: number,
    impactStrength: number,
    hitHorizontal: boolean,
    hitVertical: boolean,
  ): void {
    const strength = Phaser.Math.Clamp(impactStrength / 72, 0.15, 1);
    const count = Math.round(4 + strength * 10);

    this.flash
      .setPosition(x, y)
      .setScale(0.7 + strength * 0.8)
      .setAlpha(0.22 + strength * 0.42)
      .setVisible(true);

    let emitted = 0;
    for (const particle of this.particles) {
      if (particle.active) {
        continue;
      }

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(14, 30 + strength * 36);
      const normalBiasX = hitHorizontal ? Phaser.Math.RND.sign() * 18 : 0;
      const normalBiasY = hitVertical ? Phaser.Math.RND.sign() * 18 : 0;

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
        .setAlpha(0.45 + strength * 0.45)
        .setVisible(true);

      emitted += 1;
      if (emitted >= count) {
        break;
      }
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
  }
}
