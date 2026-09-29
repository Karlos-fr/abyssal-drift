import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
import type { DynamicLightSystem } from '../effects/DynamicLightSystem';
import type { Submarine } from '../submarine/Submarine';

interface Fish {
  body: Phaser.GameObjects.Triangle;
  vx: number;
  vy: number;
  homeY: number;
  phase: number;
}

interface Jelly {
  body: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  baseY: number;
  phase: number;
}

interface GlowCreature {
  sprite: Phaser.GameObjects.Arc;
  phase: number;
}

export class MarineLifeSystem {
  private readonly fish: Fish[] = [];
  private readonly jellies: Jelly[] = [];
  private readonly glowCreatures: GlowCreature[] = [];
  private readonly distant: Phaser.GameObjects.Ellipse[] = [];
  private readonly rareCreature: Phaser.GameObjects.Container;
  private sonarPulse = 0;
  private timeSeconds = 0;

  public constructor(scene: Phaser.Scene) {
    const random = new Phaser.Math.RandomDataGenerator(['abyssal-life']);

    for (let index = 0; index < 34; index += 1) {
      const direction = index % 2 === 0 ? 1 : -1;
      const x = random.between(100, WORLD_WIDTH - 100);
      const y = random.between(130, WORLD_HEIGHT - 120);
      const body = scene.add
        .triangle(x, y, -5, -2, -5, 2, 5, 0, 0x78a9a3, 0.55)
        .setDepth(-4)
        .setScale(direction, 1);

      this.fish.push({
        body,
        vx: direction * random.realInRange(7, 13),
        vy: random.realInRange(-0.8, 0.8),
        homeY: y,
        phase: random.realInRange(0, Math.PI * 2),
      });
    }

    for (let index = 0; index < 7; index += 1) {
      const x = random.between(300, WORLD_WIDTH - 200);
      const y = random.between(360, WORLD_HEIGHT - 120);
      const glow = scene.add
        .circle(x, y, 7, 0x7ae5d5, 0.05)
        .setDepth(-5);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      const body = scene.add
        .circle(x, y, 3.5, 0x79c5bd, 0.35)
        .setDepth(-4);

      this.jellies.push({
        body,
        glow,
        baseY: y,
        phase: random.realInRange(0, Math.PI * 2),
      });
    }

    for (let index = 0; index < 14; index += 1) {
      const sprite = scene.add
        .circle(
          random.between(650, WORLD_WIDTH - 80),
          random.between(560, WORLD_HEIGHT - 75),
          random.realInRange(0.8, 1.8),
          0x78f5e8,
          0.35,
        )
        .setDepth(-3);
      sprite.setBlendMode(Phaser.BlendModes.ADD);
      this.glowCreatures.push({
        sprite,
        phase: random.realInRange(0, Math.PI * 2),
      });
    }

    for (let index = 0; index < 5; index += 1) {
      const silhouette = scene.add
        .ellipse(
          500 + index * 320,
          240 + (index % 3) * 110,
          18 + index * 4,
          5 + index,
          0x021014,
          0.28,
        )
        .setDepth(-75)
        .setScrollFactor(0.7);
      this.distant.push(silhouette);
    }

    const rareBody = scene.add.ellipse(0, 0, 46, 10, 0x071a20, 0.55);
    const rareEye = scene.add.circle(18, -1, 1.4, 0x80f5e8, 0.55);
    rareEye.setBlendMode(Phaser.BlendModes.ADD);
    this.rareCreature = scene.add
      .container(1_720, 690, [rareBody, rareEye])
      .setDepth(-6)
      .setAlpha(0.18);
  }

  public triggerSonar(): void {
    this.sonarPulse = 1;
  }

  public update(
    submarine: Submarine,
    lighting: DynamicLightSystem,
    deltaMs: number,
  ): void {
    const dt = Math.min(deltaMs / 1_000, 1 / 20);
    this.timeSeconds += dt;
    this.sonarPulse = Math.max(0, this.sonarPulse - dt * 0.8);

    for (const fish of this.fish) {
      const dx = fish.body.x - submarine.x;
      const dy = fish.body.y - submarine.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const light = lighting.getLightAmountAt(
        fish.body.x,
        fish.body.y,
        submarine,
      );

      if (distance < 82) {
        const flee = (1 - distance / 82) * 28;
        fish.vx += (dx >= 0 ? 1 : -1) * flee * dt;
        fish.vy += (dy >= 0 ? 1 : -1) * flee * 0.45 * dt;
      }

      if (light > 0.3) {
        fish.vx += (dx >= 0 ? 1 : -1) * light * 10 * dt;
      }

      if (this.sonarPulse > 0 && distance < 210) {
        fish.vx += (dx >= 0 ? 1 : -1) * this.sonarPulse * 16 * dt;
      }

      fish.vx = Phaser.Math.Clamp(fish.vx, -24, 24);
      fish.vy = Phaser.Math.Linear(
        fish.vy,
        (fish.homeY - fish.body.y) * 0.025 +
          Math.sin(this.timeSeconds * 1.6 + fish.phase) * 0.6,
        1 - Math.exp(-1.2 * dt),
      );
      fish.body.x += fish.vx * dt;
      fish.body.y += fish.vy * dt;
      fish.body.setScale(fish.vx >= 0 ? 1 : -1, 1);
      fish.body.setAlpha(0.42 + light * 0.4 + this.sonarPulse * 0.12);

      if (fish.body.x < 55) fish.body.x = WORLD_WIDTH - 55;
      if (fish.body.x > WORLD_WIDTH - 55) fish.body.x = 55;
    }

    for (const jelly of this.jellies) {
      const bob = Math.sin(this.timeSeconds * 0.75 + jelly.phase) * 6;
      jelly.body.y = jelly.baseY + bob;
      jelly.glow.y = jelly.body.y;
      jelly.glow.setAlpha(
        0.035 +
          (Math.sin(this.timeSeconds * 2 + jelly.phase) + 1) * 0.025 +
          this.sonarPulse * 0.04,
      );
    }

    for (const creature of this.glowCreatures) {
      creature.sprite.setAlpha(
        0.22 +
          (Math.sin(this.timeSeconds * 1.8 + creature.phase) + 1) * 0.12 +
          this.sonarPulse * 0.12,
      );
    }

    this.rareCreature.y =
      690 + Math.sin(this.timeSeconds * 0.22) * 14;
    this.rareCreature.setAlpha(0.12 + this.sonarPulse * 0.18);

    for (let index = 0; index < this.distant.length; index += 1) {
      const silhouette = this.distant[index];
      if (!silhouette) continue;
      silhouette.x += (1.2 + index * 0.15) * dt;
      if (silhouette.x > WORLD_WIDTH + 80) silhouette.x = -80;
    }
  }
}
