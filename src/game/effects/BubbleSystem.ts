import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
import type { Submarine } from '../submarine/Submarine';
import type { SubmarineMotion } from '../submarine/SubmarinePhysics';

interface BubbleState {
  sprite: Phaser.GameObjects.Arc;
  active: boolean;
  velocityX: number;
  velocityY: number;
  age: number;
  lifetime: number;
  baseScale: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

const DEFAULT_POOL_SIZE = 120;
const MAX_HORIZONTAL_SPEED = 72;

/**
 * Pooled bubble wake used by the submarine.
 *
 * Shapes are intentionally generated at runtime during the prototype stage:
 * this keeps the effect cheap, transparent and independent from final art.
 */
export class BubbleSystem {
  private readonly pool: BubbleState[] = [];
  private readonly random = new Phaser.Math.RandomDataGenerator([
    'abyssal-drift-bubbles',
  ]);
  private emissionBudget = 0;

  public constructor(scene: Phaser.Scene, poolSize = DEFAULT_POOL_SIZE) {
    for (let index = 0; index < poolSize; index += 1) {
      const sprite = scene.add
        .circle(0, 0, 1, 0xd8fbff, 0.45)
        .setStrokeStyle(1, 0xffffff, 0.2)
        .setDepth(12)
        .setVisible(false);

      this.pool.push({
        sprite,
        active: false,
        velocityX: 0,
        velocityY: 0,
        age: 0,
        lifetime: 0,
        baseScale: 1,
        wobblePhase: 0,
        wobbleSpeed: 0,
      });
    }
  }

  public update(
    submarine: Submarine,
    motion: SubmarineMotion,
    deltaMs: number,
  ): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    const speedRatio = Phaser.Math.Clamp(
      Math.abs(motion.velocityX) / MAX_HORIZONTAL_SPEED,
      0,
      1,
    );

    // A tiny idle trail keeps the vessel alive; thrust adds a dense wake.
    const bubblesPerSecond = 1.5 + speedRatio * 18;
    this.emissionBudget += bubblesPerSecond * deltaSeconds;

    while (this.emissionBudget >= 1) {
      this.emissionBudget -= 1;
      this.spawn(submarine, motion, speedRatio);
    }

    for (const bubble of this.pool) {
      if (!bubble.active) {
        continue;
      }

      bubble.age += deltaSeconds;
      if (
        bubble.age >= bubble.lifetime ||
        bubble.sprite.x < 0 ||
        bubble.sprite.x > WORLD_WIDTH ||
        bubble.sprite.y < 0 ||
        bubble.sprite.y > WORLD_HEIGHT
      ) {
        this.release(bubble);
        continue;
      }

      bubble.sprite.x +=
        (bubble.velocityX +
          Math.sin(bubble.wobblePhase + bubble.age * bubble.wobbleSpeed) * 2.2) *
        deltaSeconds;
      bubble.sprite.y += bubble.velocityY * deltaSeconds;

      const life = bubble.age / bubble.lifetime;
      const growth = 1 + life * 0.55;
      const squash = 1 + Math.sin(bubble.age * 7 + bubble.wobblePhase) * 0.07;
      bubble.sprite.setScale(
        bubble.baseScale * growth * squash,
        bubble.baseScale * growth / squash,
      );

      const fade = Math.min(1, (1 - life) * 2.5);
      bubble.sprite.setAlpha((0.24 + bubble.baseScale * 0.14) * fade);
    }
  }

  public burstAt(x: number, y: number, count: number): void {
    let emitted = 0;

    for (const bubble of this.pool) {
      if (bubble.active) {
        continue;
      }

      const size = this.random.realInRange(1.5, 3.2);
      bubble.active = true;
      bubble.age = 0;
      bubble.lifetime = this.random.realInRange(1.1, 2.4);
      bubble.baseScale = size;
      bubble.wobblePhase = this.random.realInRange(0, Math.PI * 2);
      bubble.wobbleSpeed = this.random.realInRange(4, 8);
      bubble.velocityX = this.random.realInRange(-24, 24);
      bubble.velocityY = -this.random.realInRange(18, 38);
      bubble.sprite
        .setPosition(
          x + this.random.realInRange(-5, 5),
          y + this.random.realInRange(-5, 5),
        )
        .setScale(size)
        .setAlpha(this.random.realInRange(0.38, 0.62))
        .setVisible(true);

      emitted += 1;
      if (emitted >= count) {
        break;
      }
    }
  }

  private spawn(
    submarine: Submarine,
    motion: SubmarineMotion,
    speedRatio: number,
  ): void {
    const bubble = this.pool.find((candidate) => !candidate.active);
    if (!bubble) {
      return;
    }

    const facing = submarine.facingDirection;
    const size = this.random.realInRange(0.7, 2.25);

    bubble.active = true;
    bubble.age = 0;
    bubble.lifetime = this.random.realInRange(1.5, 3.6);
    bubble.baseScale = size;
    bubble.wobblePhase = this.random.realInRange(0, Math.PI * 2);
    bubble.wobbleSpeed = this.random.realInRange(3.5, 6.5);
    bubble.velocityX =
      -facing * this.random.realInRange(7, 13 + speedRatio * 20) +
      this.random.realInRange(-3, 3);

    // Vertical vessel motion slightly bends the wake before buoyancy takes over.
    bubble.velocityY =
      -this.random.realInRange(10, 19) + motion.velocityY * 0.08;

    bubble.sprite
      .setPosition(
        submarine.x - facing * 21 + this.random.realInRange(-2, 2),
        submarine.y + this.random.realInRange(-4, 4),
      )
      .setScale(size)
      .setAlpha(this.random.realInRange(0.28, 0.52))
      .setVisible(true);
  }

  private release(bubble: BubbleState): void {
    bubble.active = false;
    bubble.sprite.setVisible(false);
  }
}
