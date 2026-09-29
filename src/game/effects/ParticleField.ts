import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
import type { DynamicLightSystem } from './DynamicLightSystem';
import type { Submarine } from '../submarine/Submarine';
import type { SubmarineMotion } from '../submarine/SubmarinePhysics';

interface WaterParticle {
  sprite: Phaser.GameObjects.Arc;
  velocityX: number;
  velocityY: number;
  layer: number;
  baseAlpha: number;
}

const PARTICLE_COUNT = 150;

export class ParticleField {
  private readonly particles: WaterParticle[] = [];
  private readonly random = new Phaser.Math.RandomDataGenerator([
    'abyssal-drift-particles',
  ]);

  public constructor(scene: Phaser.Scene) {
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const layer = index % 3;
      const size = [0.55, 0.8, 1.1][layer] ?? 0.8;
      const alpha = [0.1, 0.14, 0.2][layer] ?? 0.14;
      const scrollFactor = [0.88, 0.94, 1][layer] ?? 1;

      const sprite = scene.add
        .circle(
          this.random.between(0, WORLD_WIDTH),
          this.random.between(70, WORLD_HEIGHT - 70),
          size,
          0xc6eef0,
          alpha,
        )
        .setScrollFactor(scrollFactor)
        .setDepth(-40 + layer);

      this.particles.push({
        sprite,
        velocityX: this.random.realInRange(-1.2, 1.2) * (layer + 1),
        velocityY: this.random.realInRange(-1.4, -0.25) * (layer + 1) * 0.45,
        layer,
        baseAlpha: alpha,
      });
    }
  }

  public update(
    submarine: Submarine,
    motion: SubmarineMotion,
    deltaMs: number,
    lighting?: DynamicLightSystem,
    depth = 0,
  ): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);

    for (const particle of this.particles) {
      particle.sprite.x += particle.velocityX * deltaSeconds;
      particle.sprite.y += particle.velocityY * deltaSeconds;

      const dx = particle.sprite.x - submarine.x;
      const dy = particle.sprite.y - submarine.y;
      const distanceSquared = dx * dx + dy * dy;
      const influenceRadius = 78;

      if (distanceSquared < influenceRadius * influenceRadius) {
        const influence = 1 - Math.sqrt(distanceSquared) / influenceRadius;
        const layerInfluence = 0.08 + particle.layer * 0.045;

        particle.sprite.x -=
          motion.velocityX * influence * layerInfluence * deltaSeconds;
        particle.sprite.y -=
          motion.velocityY * influence * layerInfluence * deltaSeconds;
      }

      // Prop wash pushes nearby suspended matter backwards in a narrow cone.
      // This makes thrust readable even when bubbles are hard to see.
      const propellerX = submarine.x - 28;
      const propellerY = submarine.y;
      const washDx = particle.sprite.x - propellerX;
      const washDy = particle.sprite.y - propellerY;
      const washSpeed = Math.abs(motion.velocityX);
      const behindPropeller =
        motion.velocityX >= 0 ? washDx <= 0 : washDx >= 0;
      const washDistance = Math.abs(washDx);

      if (
        washSpeed > 5 &&
        behindPropeller &&
        washDistance < 82 &&
        Math.abs(washDy) < 14 + washDistance * 0.12
      ) {
        const washStrength =
          (1 - washDistance / 82) * Phaser.Math.Clamp(washSpeed / 72, 0, 1);
        const direction = motion.velocityX >= 0 ? -1 : 1;
        particle.sprite.x += direction * washStrength * 34 * deltaSeconds;
        particle.sprite.y += washDy * washStrength * 0.08 * deltaSeconds;
      }

      const depthDensity = 0.72 + depth * 0.65;
      particle.sprite.setVisible(
        particle.layer > 0 || depth > 0.32 || particle.sprite.x % 3 < depthDensity,
      );

      if (lighting) {
        const light = lighting.getLightAmountAt(
          particle.sprite.x,
          particle.sprite.y,
          submarine,
        );
        particle.sprite.setAlpha(
          Phaser.Math.Clamp(
            particle.baseAlpha * depthDensity + light * 0.55,
            0,
            0.78,
          ),
        );
        particle.sprite.setScale(1 + light * 0.32);
      }

      this.wrap(particle.sprite);
    }
  }

  private wrap(sprite: Phaser.GameObjects.Arc): void {
    if (sprite.x < 0) {
      sprite.x += WORLD_WIDTH;
    } else if (sprite.x > WORLD_WIDTH) {
      sprite.x -= WORLD_WIDTH;
    }

    if (sprite.y < 65) {
      sprite.y = WORLD_HEIGHT - 65;
    } else if (sprite.y > WORLD_HEIGHT - 65) {
      sprite.y = 65;
    }
  }
}
