import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
import type { MovementInput } from '../input/InputController';
import { SubmarineEffects } from './SubmarineEffects';
import { SubmarinePhysics } from './SubmarinePhysics';

const HALF_WIDTH = 17;
const HALF_HEIGHT = 8;
const MAX_VISUAL_SPEED = 72;

export class Submarine extends Phaser.GameObjects.Container {
  private readonly physicsModel = new SubmarinePhysics();
  private readonly effects: SubmarineEffects;
  private readonly propeller: Phaser.GameObjects.Rectangle;
  private elapsedSeconds = 0;

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

  public updateFromInput(input: MovementInput, deltaMs: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    this.elapsedSeconds += deltaSeconds;

    const motion = this.physicsModel.step(input, deltaSeconds);
    this.x += motion.velocityX * deltaSeconds;
    this.y += motion.velocityY * deltaSeconds;

    this.x = Phaser.Math.Clamp(this.x, HALF_WIDTH, WORLD_WIDTH - HALF_WIDTH);
    this.y = Phaser.Math.Clamp(this.y, HALF_HEIGHT, WORLD_HEIGHT - HALF_HEIGHT);

    const direction =
      Math.abs(motion.velocityX) > 0.75
        ? Math.sign(motion.velocityX)
        : this.scaleX < 0
          ? -1
          : 1;

    this.setScale(direction, 1);
    this.rotation = motion.pitch * direction;

    const speedRatio = Math.min(Math.abs(motion.velocityX) / MAX_VISUAL_SPEED, 1);
    this.propeller.rotation += deltaSeconds * (5 + speedRatio * 22) * direction;
    this.effects.update(speedRatio, this.elapsedSeconds);
  }
}
