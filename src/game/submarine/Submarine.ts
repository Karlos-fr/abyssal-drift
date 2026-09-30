import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../core/constants';
import { Palette } from '../core/Palette';
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
  private readonly visualBody: Phaser.GameObjects.Container;
  private elapsedSeconds = 0;
  private currentMotion: SubmarineMotion = {
    velocityX: 0,
    velocityY: 0,
    pitch: 0,
  };

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    // The actual beam is rendered in world space by DynamicLightSystem so it
    // can be clipped against cave geometry. Only the physical lamp belongs to
    // the submarine container.
    const headlightHalo = scene.add
      .circle(17, -1, 5, 0xd8fdff, 0.07);
    headlightHalo.setBlendMode(Phaser.BlendModes.ADD);

    const shadow = scene.add.ellipse(1, 3, 35, 13, 0x101718, 0.35);
    const body = scene.add.rectangle(0, 0, 31, 13, Palette.submarineHull, 1);
    body.setStrokeStyle(2, Palette.submarineShade, 1);
    const nose = scene.add.rectangle(16, 0, 5, 9, Palette.submarineHull, 1);
    const hullHighlight = scene.add.rectangle(2, -4, 22, 2, Palette.submarineHighlight, 0.65);

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
      Palette.submarineShade,
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

    const belly = scene.add.rectangle(0, 5, 22, 3, Palette.submarineShade, 0.95);
    const tower = scene.add.rectangle(-2, -8, 10, 5, Palette.submarineHull);
    const windowFront = scene.add.rectangle(8, -1, 5, 5, Palette.glass, 0.9);
    const windowRear = scene.add.rectangle(0, -1, 4, 4, Palette.glass, 0.8);
    const light = scene.add.circle(17, -1, 2, 0xf4f0c2, 1);

    this.visualBody = scene.add.container(0, 0, [
      headlightHalo,
      rearFairing,
      shaft,
      this.propeller,
      shadow,
      body,
      nose,
      hullHighlight,
      belly,
      tower,
      windowFront,
      windowRear,
      light,
    ]);
    this.add(this.visualBody);
    this.setDepth(20);

    this.effects = new SubmarineEffects(
      this,
      this.visualBody,
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
    this.effects.update(
      speedRatio,
      input.horizontal,
      this.elapsedSeconds,
      deltaSeconds,
    );

    return this.currentMotion;
  }

  public triggerImpact(
    strength: number,
    hitHorizontal: boolean,
    hitVertical: boolean,
  ): void {
    this.effects.triggerImpact(strength, hitHorizontal, hitVertical);
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
