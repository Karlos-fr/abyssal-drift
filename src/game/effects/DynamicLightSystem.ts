import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/constants';
import type { CaveBlock } from '../ocean/CaveSystem';
import type { Submarine } from '../submarine/Submarine';

interface Point {
  x: number;
  y: number;
}

const MAX_DISTANCE = 225;
const HALF_ANGLE = Phaser.Math.DegToRad(15);
const RAY_COUNT = 72;
const RAY_STEP = 3;
const BEAM_LAYERS = 14;

export class DynamicLightSystem {
  private readonly beam: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly darkness: Phaser.GameObjects.Rectangle;
  private timeSeconds = 0;
  private beamAngle = 0;
  private impactDisturbance = 0;

  public constructor(
    scene: Phaser.Scene,
    private readonly blocks: readonly CaveBlock[],
  ) {
    this.darkness = scene.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x001018,
        0.06,
      )
      .setScrollFactor(0)
      .setDepth(7);
    this.darkness.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.beam = scene.add.graphics().setDepth(15);
    this.glow = scene.add.graphics().setDepth(16);
    this.beam.setBlendMode(Phaser.BlendModes.ADD);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
  }

  public update(submarine: Submarine, deltaMs: number, depth: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    this.timeSeconds += deltaSeconds;

    this.beamAngle = Phaser.Math.Angle.RotateTo(
      this.beamAngle,
      submarine.rotation,
      (1 - Math.exp(-5 * deltaSeconds)) * 0.18,
    );

    const originX = submarine.x + Math.cos(submarine.rotation) * 18;
    const originY = submarine.y + Math.sin(submarine.rotation) * 18 - 1;

    this.impactDisturbance = Phaser.Math.Linear(
      this.impactDisturbance,
      0,
      1 - Math.exp(-7 * deltaSeconds),
    );

    const drift =
      Math.sin(this.timeSeconds * 0.72) * 0.006 +
      Math.sin(this.timeSeconds * 39) * this.impactDisturbance;
    const centerAngle = this.beamAngle + drift;
    const depthBoost =
      (0.78 + depth * 0.28) *
      (1 - Math.abs(this.impactDisturbance) * 2.2);

    this.darkness.setAlpha(0.045 + depth * 0.16);

    this.beam.clear();

    for (let index = BEAM_LAYERS - 1; index >= 0; index -= 1) {
      const t = index / (BEAM_LAYERS - 1);
      const distance = Phaser.Math.Linear(MAX_DISTANCE * 0.28, MAX_DISTANCE, t);
      const halfAngle = Phaser.Math.Linear(HALF_ANGLE * 0.28, HALF_ANGLE, t);
      const alpha =
        Phaser.Math.Linear(0.052, 0.0045, t) *
        depthBoost *
        (1 - t * 0.15);

      const fan = this.castFan(
        originX,
        originY,
        centerAngle,
        halfAngle,
        distance,
      );

      this.drawFan(
        this.beam,
        originX,
        originY,
        fan,
        0xe7fbff,
        alpha,
      );
    }

    this.glow.clear();
    const flicker =
      Math.sin(this.timeSeconds * 9.4) * 0.012 +
      Math.sin(this.timeSeconds * 19.1) * 0.006;

    this.glow.fillStyle(0xf5ffff, (0.08 + flicker) * depthBoost);
    this.glow.fillCircle(originX, originY, 4.5);
    this.glow.fillStyle(0xcff7fb, (0.026 + flicker * 0.2) * depthBoost);
    this.glow.fillCircle(originX, originY, 9);
  }

  public triggerImpact(strength: number): void {
    const normalized = Phaser.Math.Clamp(strength, 0, 1);
    this.impactDisturbance = Math.max(
      this.impactDisturbance,
      0.01 + normalized * 0.035,
    );
  }

  public getLightAmountAt(x: number, y: number, submarine: Submarine): number {
    const originX = submarine.x + Math.cos(submarine.rotation) * 18;
    const originY = submarine.y + Math.sin(submarine.rotation) * 18 - 1;
    const dx = x - originX;
    const dy = y - originY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > MAX_DISTANCE || distance < 1) {
      return 0;
    }

    const angle = Math.atan2(dy, dx);
    const angleDelta = Math.abs(Phaser.Math.Angle.Wrap(angle - this.beamAngle));
    if (angleDelta > HALF_ANGLE) {
      return 0;
    }

    if (this.rayBlocked(originX, originY, angle, distance)) {
      return 0;
    }

    const angular = 1 - angleDelta / HALF_ANGLE;
    const distanceFade = 1 - distance / MAX_DISTANCE;
    return Phaser.Math.Clamp(
      angular * angular * 0.7 + distanceFade * distanceFade * 0.3,
      0,
      1,
    );
  }

  private castFan(
    originX: number,
    originY: number,
    centerAngle: number,
    halfAngle: number,
    maxDistance: number,
  ): Point[] {
    const points: Point[] = [];

    for (let index = 0; index < RAY_COUNT; index += 1) {
      const t = index / (RAY_COUNT - 1);
      const angle = centerAngle - halfAngle + t * halfAngle * 2;
      points.push(this.castRay(originX, originY, angle, maxDistance));
    }

    return points;
  }

  private castRay(
    originX: number,
    originY: number,
    angle: number,
    maxDistance: number,
  ): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let distance = RAY_STEP; distance <= maxDistance; distance += RAY_STEP) {
      const x = originX + cos * distance;
      const y = originY + sin * distance;

      if (this.isSolid(x, y)) {
        return {
          x: originX + cos * Math.max(0, distance - RAY_STEP),
          y: originY + sin * Math.max(0, distance - RAY_STEP),
        };
      }
    }

    return {
      x: originX + cos * maxDistance,
      y: originY + sin * maxDistance,
    };
  }

  private rayBlocked(
    originX: number,
    originY: number,
    angle: number,
    distance: number,
  ): boolean {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (let step = RAY_STEP; step < distance; step += RAY_STEP * 2) {
      if (this.isSolid(originX + cos * step, originY + sin * step)) {
        return true;
      }
    }

    return false;
  }

  private isSolid(x: number, y: number): boolean {
    for (const block of this.blocks) {
      if (
        x >= block.x &&
        x <= block.x + block.width &&
        y >= block.y &&
        y <= block.y + block.height
      ) {
        return true;
      }
    }

    return false;
  }

  private drawFan(
    graphics: Phaser.GameObjects.Graphics,
    originX: number,
    originY: number,
    points: readonly Point[],
    color: number,
    alpha: number,
  ): void {
    if (points.length < 2) {
      return;
    }

    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(originX, originY);

    for (const point of points) {
      graphics.lineTo(point.x, point.y);
    }

    graphics.closePath();
    graphics.fillPath();
  }
}
