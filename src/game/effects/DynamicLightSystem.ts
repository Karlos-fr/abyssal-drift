import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../core/constants';
import type { CaveBlock } from '../ocean/CaveSystem';
import type { Submarine } from '../submarine/Submarine';

interface Point {
  x: number;
  y: number;
}

const MAX_DISTANCE = 260;
const HALF_ANGLE = Phaser.Math.DegToRad(25);
const RAY_COUNT = 45;
const RAY_STEP = 3;

export class DynamicLightSystem {
  private readonly beam: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly darkness: Phaser.GameObjects.Rectangle;
  private timeSeconds = 0;
  private beamAngle = 0;

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
        0.08,
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

    // The lamp direction has a little inertia. This makes the beam feel like
    // light mounted on a heavy vehicle rather than geometry welded to a sprite.
    const angleBlend = 1 - Math.exp(-5.2 * deltaSeconds);
    this.beamAngle = Phaser.Math.Angle.RotateTo(
      this.beamAngle,
      submarine.rotation,
      angleBlend * 0.18,
    );

    const originX = submarine.x + Math.cos(submarine.rotation) * 17;
    const originY = submarine.y + Math.sin(submarine.rotation) * 17 - 1;
    const drift = Math.sin(this.timeSeconds * 0.8) * 0.012;
    const centerAngle = this.beamAngle + drift;
    const depthBoost = 0.75 + depth * 0.35;

    this.darkness.setAlpha(0.06 + depth * 0.18);

    const outer = this.castFan(
      originX,
      originY,
      centerAngle,
      HALF_ANGLE,
      MAX_DISTANCE,
    );
    const middle = this.castFan(
      originX,
      originY,
      centerAngle,
      HALF_ANGLE * 0.68,
      MAX_DISTANCE * 0.88,
    );
    const core = this.castFan(
      originX,
      originY,
      centerAngle,
      HALF_ANGLE * 0.36,
      MAX_DISTANCE * 0.72,
    );

    this.beam.clear();
    this.drawFan(this.beam, originX, originY, outer, 0xb7f8ff, 0.03 * depthBoost);
    this.drawFan(this.beam, originX, originY, middle, 0xc9fbff, 0.055 * depthBoost);
    this.drawFan(this.beam, originX, originY, core, 0xe6ffff, 0.095 * depthBoost);

    this.glow.clear();
    const flicker =
      Math.sin(this.timeSeconds * 13.1) * 0.04 +
      Math.sin(this.timeSeconds * 23.7) * 0.018;
    this.glow.fillStyle(0xe9ffff, (0.14 + flicker) * depthBoost);
    this.glow.fillCircle(originX, originY, 7.5);
    this.glow.fillStyle(0xbdfaff, (0.05 + flicker * 0.3) * depthBoost);
    this.glow.fillCircle(originX, originY, 13);
  }

  public getLightAmountAt(x: number, y: number, submarine: Submarine): number {
    const originX = submarine.x + Math.cos(submarine.rotation) * 17;
    const originY = submarine.y + Math.sin(submarine.rotation) * 17 - 1;
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
    return Phaser.Math.Clamp(angular * 0.65 + distanceFade * 0.35, 0, 1);
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
