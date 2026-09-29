import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
import type { Submarine } from '../submarine/Submarine';
import type { SubmarineMotion } from '../submarine/SubmarinePhysics';

interface WaterParticle {
  sprite: Phaser.GameObjects.Arc;
  velocityX: number;
  velocityY: number;
  layer: number;
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
      });
    }
  }

  public update(
    submarine: Submarine,
    motion: SubmarineMotion,
    deltaMs: number,
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
