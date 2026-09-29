import Phaser from 'phaser';
import type { MovementInput } from '../input/InputController';

export interface SubmarineMotion {
  velocityX: number;
  velocityY: number;
  pitch: number;
}

const HORIZONTAL_ACCELERATION = 78;
const VERTICAL_ACCELERATION = 62;
const HORIZONTAL_DRAG = 0.82;
const VERTICAL_DRAG = 1.35;
const BUOYANCY = -3.2;
const MAX_HORIZONTAL_SPEED = 72;
const MAX_VERTICAL_SPEED = 48;
const MAX_PITCH = 0.13;

export class SubmarinePhysics {
  private velocityX = 0;
  private velocityY = 0;
  private pitch = 0;

  public step(input: MovementInput, deltaSeconds: number): SubmarineMotion {
    this.velocityX += input.horizontal * HORIZONTAL_ACCELERATION * deltaSeconds;
    this.velocityY += input.vertical * VERTICAL_ACCELERATION * deltaSeconds;
    this.velocityY += BUOYANCY * deltaSeconds;

    this.velocityX *= Math.exp(-HORIZONTAL_DRAG * deltaSeconds);
    this.velocityY *= Math.exp(-VERTICAL_DRAG * deltaSeconds);

    this.velocityX = Phaser.Math.Clamp(
      this.velocityX,
      -MAX_HORIZONTAL_SPEED,
      MAX_HORIZONTAL_SPEED,
    );
    this.velocityY = Phaser.Math.Clamp(
      this.velocityY,
      -MAX_VERTICAL_SPEED,
      MAX_VERTICAL_SPEED,
    );

    const targetPitch =
      Phaser.Math.Clamp(this.velocityY / MAX_VERTICAL_SPEED, -1, 1) * MAX_PITCH;
    this.pitch = Phaser.Math.Linear(
      this.pitch,
      targetPitch,
      1 - Math.exp(-5 * deltaSeconds),
    );

    return {
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      pitch: this.pitch,
    };
  }
}
