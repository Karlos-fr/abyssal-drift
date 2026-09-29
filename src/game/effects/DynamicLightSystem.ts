import Phaser from 'phaser';
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

/**
 * Dynamic, occluded submarine headlight.
 *
 * Rays are marched through the same block geometry used for collisions. The
 * resulting visibility polygon stops exactly at cave walls, then several
 * low-alpha polygons are layered to fake soft underwater falloff.
 */
export class DynamicLightSystem {
  private readonly beam: Phaser.GameObjects.Graphics;
  private readonly glow: Phaser.GameObjects.Graphics;
  private timeSeconds = 0;

  public constructor(
    scene: Phaser.Scene,
    private readonly blocks: readonly CaveBlock[],
  ) {
    this.beam = scene.add.graphics().setDepth(15);
    this.glow = scene.add.graphics().setDepth(16);
    this.beam.setBlendMode(Phaser.BlendModes.ADD);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
  }

  public update(submarine: Submarine, deltaMs: number, depth: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    this.timeSeconds += deltaSeconds;

    const pitch = submarine.rotation;
    const originX = submarine.x + Math.cos(pitch) * 17;
    const originY = submarine.y + Math.sin(pitch) * 17 - 1;
    const drift = Math.sin(this.timeSeconds * 0.8) * 0.012;
    const centerAngle = pitch + drift;
    const depthBoost = 0.75 + depth * 0.35;

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
    this.drawFan(this.beam, originX, originY, outer, 0xb7f8ff, 0.025 * depthBoost);
    this.drawFan(this.beam, originX, originY, middle, 0xc9fbff, 0.045 * depthBoost);
    this.drawFan(this.beam, originX, originY, core, 0xe6ffff, 0.075 * depthBoost);

    this.glow.clear();
    const flicker =
      Math.sin(this.timeSeconds * 13.1) * 0.04 +
      Math.sin(this.timeSeconds * 23.7) * 0.018;
    this.glow.fillStyle(0xe9ffff, (0.14 + flicker) * depthBoost);
    this.glow.fillCircle(originX, originY, 7.5);
    this.glow.fillStyle(0xbdfaff, (0.05 + flicker * 0.3) * depthBoost);
    this.glow.fillCircle(originX, originY, 13);
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
