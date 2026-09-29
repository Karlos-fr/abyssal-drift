import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
import type { MovementInput } from '../input/InputController';
import { SubmarineEffects } from './SubmarineEffects';
import {
  SubmarinePhysics,
  type SubmarineMotion,
} from './SubmarinePhysics';

const HALF_WIDTH = 22;
const HALF_HEIGHT = 9;
const MAX_VISUAL_SPEED = 72;

export class Submarine extends Phaser.GameObjects.Container {
  private readonly physicsModel = new SubmarinePhysics();
  private readonly effects: SubmarineEffects;
  private readonly propeller: Phaser.GameObjects.Container;
  private elapsedSeconds = 0;
  private currentMotion: SubmarineMotion = {
    velocityX: 0,
    velocityY: 0,
    pitch: 0,
  };

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    // The headlight is built from many low-alpha slices. The overlapping
    // additive layers create a soft falloff instead of visible solid triangles.
    const headlightBeam = scene.add.graphics();
    const beamLayers = 22;
    for (let index = beamLayers; index >= 1; index -= 1) {
      const t = index / beamLayers;
      const length = 38 + t * 128;
      const halfHeight = 4 + t * 36;
      const alpha = 0.004 + (1 - t) * 0.005;
      headlightBeam.fillStyle(0xc9fbff, alpha);
      headlightBeam.fillTriangle(
        15,
        -2.2,
        length,
        -halfHeight,
        length,
        halfHeight,
      );
    }
    headlightBeam.setBlendMode(Phaser.BlendModes.ADD);

    const headlightHalo = scene.add
      .circle(17, -1, 6, 0xd8fdff, 0.13);
    headlightHalo.setBlendMode(Phaser.BlendModes.ADD);

    const body = scene.add.ellipse(0, 0, 34, 14, 0xb3b35f);
    body.setStrokeStyle(2, 0x48492c, 1);

    // Rear fairing visually joins the propeller shaft to the hull.
    const rearFairing = scene.add.triangle(
      -20,
      0,
      0,
      -5,
      0,
      5,
      8,
      0,
      0x8b8e4d,
      1,
    );
    const shaft = scene.add.rectangle(-23, 0, 8, 2, 0x777d54, 1);

    const propellerHub = scene.add.circle(0, 0, 2.2, 0x8f9b72, 1);
    const propellerBladeA = scene.add.ellipse(0, -4, 2.5, 8, 0x9fb08a, 0.9);
    const propellerBladeB = scene.add.ellipse(0, 4, 2.5, 8, 0x9fb08a, 0.9);
    this.propeller = scene.add.container(-28, 0, [
      propellerBladeA,
      propellerBladeB,
      propellerHub,
    ]);

    const belly = scene.add.rectangle(0, 5, 21, 3, 0x6f733f, 0.9);
    const tower = scene.add.rectangle(-2, -8, 9, 5, 0x9b9d55);
    const windowFront = scene.add.circle(8, -1, 3, 0x76d8e3, 0.9);
    const windowRear = scene.add.circle(0, -1, 2.4, 0x6cb8c5, 0.85);
    const light = scene.add.circle(17, -1, 2, 0xf4f0c2, 1);

    this.add([
      headlightBeam,
      headlightHalo,
      rearFairing,
      shaft,
      this.propeller,
      body,
      belly,
      tower,
      windowFront,
      windowRear,
      light,
    ]);
    this.setDepth(20);

    this.effects = new SubmarineEffects(
      this,
      headlightBeam,
      headlightHalo,
    );
  }

  public get facingDirection(): number {
    return 1;
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

    // Left input is reverse thrust. The vessel keeps facing right instead of
    // instantly mirroring like a character sprite.
    this.setScale(1, 1);
    this.rotation = this.currentMotion.pitch;

    const speedRatio = Math.min(
      Math.abs(this.currentMotion.velocityX) / MAX_VISUAL_SPEED,
      1,
    );
    const propellerDirection =
      Math.abs(this.currentMotion.velocityX) < 0.5
        ? 1
        : Math.sign(this.currentMotion.velocityX);
    this.propeller.rotation +=
      deltaSeconds * (5 + speedRatio * 22) * propellerDirection;
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
