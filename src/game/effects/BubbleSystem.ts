import Phaser from 'phaser';
import { WATER_WATER_SURFACE_Y, WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
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

interface AmbientVent {
  x: number;
  y: number;
  rate: number;
  budget: number;
}

const DEFAULT_POOL_SIZE = 150;
const MAX_HORIZONTAL_SPEED = 72;

export class BubbleSystem {
  private readonly pool: BubbleState[] = [];
  private readonly random = new Phaser.Math.RandomDataGenerator([
    'abyssal-drift-bubbles',
  ]);
  private readonly vents: AmbientVent[] = [
    { x: 455, y: 806, rate: 0.75, budget: 0 },
    { x: 1_015, y: 805, rate: 1.05, budget: 0 },
    { x: 1_455, y: 478, rate: 0.65, budget: 0 },
    { x: 1_735, y: 806, rate: 0.9, budget: 0 },
  ];
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

    const bubblesPerSecond = 1.5 + speedRatio * 18;
    this.emissionBudget += bubblesPerSecond * deltaSeconds;

    while (this.emissionBudget >= 1) {
      this.emissionBudget -= 1;
      this.spawnWake(submarine, motion, speedRatio);
    }

    this.updateAmbientVents(deltaSeconds);

    for (const bubble of this.pool) {
      if (!bubble.active) {
        continue;
      }

      bubble.age += deltaSeconds;

      // Bubbles reaching the waterline flatten, expand and fade before being
      // returned to the pool, suggesting a small surface pop without particles.
      if (bubble.sprite.y <= WATER_SURFACE_Y) {
        bubble.sprite.y = WATER_SURFACE_Y;
        bubble.sprite.scaleX *= 1.08;
        bubble.sprite.scaleY *= 0.72;
        bubble.sprite.alpha *= 0.72;

        if (bubble.sprite.alpha < 0.035) {
          this.release(bubble);
        }
        continue;
      }

      if (
        bubble.age >= bubble.lifetime ||
        bubble.sprite.x < 0 ||
        bubble.sprite.x > WORLD_WIDTH ||
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

      this.activateBubble(
        bubble,
        x + this.random.realInRange(-5, 5),
        y + this.random.realInRange(-5, 5),
        this.random.realInRange(1.5, 3.2),
        this.random.realInRange(-24, 24),
        -this.random.realInRange(18, 38),
        this.random.realInRange(1.1, 2.4),
      );

      emitted += 1;
      if (emitted >= count) {
        break;
      }
    }
  }

  private updateAmbientVents(deltaSeconds: number): void {
    for (const vent of this.vents) {
      vent.budget += vent.rate * deltaSeconds;

      while (vent.budget >= 1) {
        vent.budget -= 1;
        const bubble = this.pool.find((candidate) => !candidate.active);
        if (!bubble) {
          return;
        }

        this.activateBubble(
          bubble,
          vent.x + this.random.realInRange(-5, 5),
          vent.y + this.random.realInRange(-2, 2),
          this.random.realInRange(0.55, 1.45),
          this.random.realInRange(-2.2, 2.2),
          -this.random.realInRange(8, 14),
          this.random.realInRange(8, 15),
        );
      }
    }
  }

  private spawnWake(
    submarine: Submarine,
    motion: SubmarineMotion,
    speedRatio: number,
  ): void {
    const bubble = this.pool.find((candidate) => !candidate.active);
    if (!bubble) {
      return;
    }

    const size = this.random.realInRange(0.7, 2.25);
    this.activateBubble(
      bubble,
      submarine.x - 28 + this.random.realInRange(-2, 2),
      submarine.y + this.random.realInRange(-4, 4),
      size,
      -this.random.realInRange(7, 13 + speedRatio * 20) +
        this.random.realInRange(-3, 3),
      -this.random.realInRange(10, 19) + motion.velocityY * 0.08,
      this.random.realInRange(1.5, 3.6),
    );
  }

  private activateBubble(
    bubble: BubbleState,
    x: number,
    y: number,
    size: number,
    velocityX: number,
    velocityY: number,
    lifetime: number,
  ): void {
    bubble.active = true;
    bubble.age = 0;
    bubble.lifetime = lifetime;
    bubble.baseScale = size;
    bubble.wobblePhase = this.random.realInRange(0, Math.PI * 2);
    bubble.wobbleSpeed = this.random.realInRange(3.5, 7);
    bubble.velocityX = velocityX;
    bubble.velocityY = velocityY;
    bubble.sprite
      .setPosition(x, y)
      .setScale(size)
      .setAlpha(this.random.realInRange(0.25, 0.55))
      .setVisible(true);
  }

  private release(bubble: BubbleState): void {
    bubble.active = false;
    bubble.sprite.setVisible(false);
  }
}
