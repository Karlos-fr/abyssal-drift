import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
import type { MovementInput } from '../input/InputController';
import { SubmarineEffects } from './SubmarineEffects';
import {
  SubmarinePhysics,
  type SubmarineMotion,
} from './SubmarinePhysics';

const HALF_WIDTH = 17;
const HALF_HEIGHT = 8;
const MAX_VISUAL_SPEED = 72;

export class Submarine extends Phaser.GameObjects.Container {
  private readonly physicsModel = new SubmarinePhysics();
  private readonly effects: SubmarineEffects;
  private readonly propeller: Phaser.GameObjects.Rectangle;
  private elapsedSeconds = 0;
  private currentMotion: SubmarineMotion = {
    velocityX: 0,
    velocityY: 0,
    pitch: 0,
  };
  private facing = 1;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    const body = scene.add.ellipse(0, 0, 34, 14, 0xb3b35f);
    body.setStrokeStyle(2, 0x48492c, 1);

    const belly = scene.add.rectangle(0, 5, 21, 3, 0x6f733f, 0.9);
    const tower = scene.add.rectangle(-2, -8, 9, 5, 0x9b9d55);
    const windowFront = scene.add.circle(8, -1, 3, 0x76d8e3, 0.9);
    const windowRear = scene.add.circle(0, -1, 2.4, 0x6cb8c5, 0.85);
    const light = scene.add.circle(17, -1, 1.8, 0xf4f0c2, 1);
    this.propeller = scene.add.rectangle(-20, 0, 3, 11, 0x8c9a78, 0.9);

    this.add([this.propeller, body, belly, tower, windowFront, windowRear, light]);
    this.setDepth(20);

    this.effects = new SubmarineEffects(this);
  }

  public get facingDirection(): number {
    return this.facing;
  }

  public get motion(): SubmarineMotion {
    return this.currentMotion;
  }

  public get collisionHalfWidth(): number {
    return HALF_WIDTH;
  }

  public get collisionHalfHeight(): number {
    return HALF_HEIGHT;
  }

  public updateFromInput(input: MovementInput, deltaMs: number): SubmarineMotion {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    this.elapsedSeconds += deltaSeconds;

    this.currentMotion = this.physicsModel.step(input, deltaSeconds);
    this.x += this.currentMotion.velocityX * deltaSeconds;
    this.y += this.currentMotion.velocityY * deltaSeconds;

    this.x = Phaser.Math.Clamp(this.x, HALF_WIDTH, WORLD_WIDTH - HALF_WIDTH);
    this.y = Phaser.Math.Clamp(this.y, HALF_HEIGHT, WORLD_HEIGHT - HALF_HEIGHT);

    if (Math.abs(this.currentMotion.velocityX) > 0.75) {
      this.facing = Math.sign(this.currentMotion.velocityX);
    }

    this.setScale(this.facing, 1);
    this.rotation = this.currentMotion.pitch * this.facing;

    const speedRatio = Math.min(
      Math.abs(this.currentMotion.velocityX) / MAX_VISUAL_SPEED,
      1,
    );
    this.propeller.rotation +=
      deltaSeconds * (5 + speedRatio * 22) * this.facing;
    this.effects.update(speedRatio, this.elapsedSeconds);

    return this.currentMotion;
  }

  public resolveCollision(
    x: number,
    y: number,
    hitHorizontal: boolean,
    hitVertical: boolean,
  ): SubmarineMotion {
    this.setPosition(x, y);
    this.currentMotion = this.physicsModel.resolveCollision(
      hitHorizontal,
      hitVertical,
    );
    return this.currentMotion;
  }
}
