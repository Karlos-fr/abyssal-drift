import Phaser from 'phaser';
import type { MovementInput } from './InputController';

const JOYSTICK_X = 70;
const JOYSTICK_Y = 205;
const JOYSTICK_RADIUS = 38;
const JOYSTICK_CAPTURE_RADIUS = 62;
const SONAR_X = 410;
const SONAR_Y = 205;
const SONAR_RADIUS = 31;

/**
 * Touch-first controls for phones and tablets.
 *
 * A single left thumb controls an analog joystick while a second pointer can
 * trigger sonar independently. The overlay is only created on touch-capable
 * devices, so desktop controls stay visually clean.
 */
export class TouchControls {
  private readonly enabled: boolean;
  private readonly base: Phaser.GameObjects.Arc | null;
  private readonly knob: Phaser.GameObjects.Arc | null;
  private readonly sonarButton: Phaser.GameObjects.Arc | null;
  private readonly sonarLabel: Phaser.GameObjects.Text | null;
  private movementPointerId: number | null = null;
  private movement: MovementInput = { horizontal: 0, vertical: 0 };
  private sonarQueued = false;

  private readonly handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (!this.enabled) {
      return;
    }

    const sonarDistance = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      SONAR_X,
      SONAR_Y,
    );

    if (sonarDistance <= SONAR_RADIUS + 14) {
      this.sonarQueued = true;
      this.sonarButton?.setScale(0.92).setAlpha(0.52);
      return;
    }

    const joystickDistance = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      JOYSTICK_X,
      JOYSTICK_Y,
    );

    if (
      this.movementPointerId === null &&
      joystickDistance <= JOYSTICK_CAPTURE_RADIUS
    ) {
      this.movementPointerId = pointer.id;
      this.updateJoystick(pointer.x, pointer.y);
    }
  };

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.enabled || pointer.id !== this.movementPointerId) {
      return;
    }

    this.updateJoystick(pointer.x, pointer.y);
  };

  private readonly handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.enabled) {
      return;
    }

    if (pointer.id === this.movementPointerId) {
      this.movementPointerId = null;
      this.movement = { horizontal: 0, vertical: 0 };
      this.knob?.setPosition(JOYSTICK_X, JOYSTICK_Y);
    }

    this.sonarButton?.setScale(1).setAlpha(0.34);
  };

  public constructor(private readonly scene: Phaser.Scene) {
    this.enabled =
      navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

    if (!this.enabled) {
      this.base = null;
      this.knob = null;
      this.sonarButton = null;
      this.sonarLabel = null;
      return;
    }

    // Phaser creates one touch pointer by default. Two extra pointers make
    // joystick + sonar + an incidental third touch safe on mobile.
    scene.input.addPointer(2);

    this.base = scene.add
      .circle(JOYSTICK_X, JOYSTICK_Y, JOYSTICK_RADIUS, 0x07151e, 0.26)
      .setStrokeStyle(2, 0xa8eaf0, 0.34)
      .setScrollFactor(0)
      .setDepth(2_000);

    scene.add
      .circle(JOYSTICK_X, JOYSTICK_Y, JOYSTICK_RADIUS - 10, 0x000000, 0)
      .setStrokeStyle(1, 0xa8eaf0, 0.12)
      .setScrollFactor(0)
      .setDepth(2_000);

    this.knob = scene.add
      .circle(JOYSTICK_X, JOYSTICK_Y, 14, 0x9cecf2, 0.28)
      .setStrokeStyle(1, 0xe8ffff, 0.45)
      .setScrollFactor(0)
      .setDepth(2_001);

    this.sonarButton = scene.add
      .circle(SONAR_X, SONAR_Y, SONAR_RADIUS, 0x0b3340, 0.34)
      .setStrokeStyle(2, 0x82f5ed, 0.5)
      .setScrollFactor(0)
      .setDepth(2_000);

    this.sonarLabel = scene.add
      .text(SONAR_X, SONAR_Y, 'SONAR', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#c8fffb',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2_001);

    scene.input.on('pointerdown', this.handlePointerDown);
    scene.input.on('pointermove', this.handlePointerMove);
    scene.input.on('pointerup', this.handlePointerUp);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  public readMovement(): MovementInput {
    return this.movement;
  }

  public consumeSonarPressed(): boolean {
    if (!this.sonarQueued) {
      return false;
    }

    this.sonarQueued = false;
    return true;
  }

  private updateJoystick(pointerX: number, pointerY: number): void {
    const dx = pointerX - JOYSTICK_X;
    const dy = pointerY - JOYSTICK_Y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scale =
      distance > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / distance : 1;
    const clampedX = dx * scale;
    const clampedY = dy * scale;

    this.knob?.setPosition(
      JOYSTICK_X + clampedX,
      JOYSTICK_Y + clampedY,
    );

    const deadZone = 0.14;
    const normalizedX = clampedX / JOYSTICK_RADIUS;
    const normalizedY = clampedY / JOYSTICK_RADIUS;

    this.movement = {
      horizontal:
        Math.abs(normalizedX) < deadZone ? 0 : normalizedX,
      vertical:
        Math.abs(normalizedY) < deadZone ? 0 : normalizedY,
    };
  }

  private destroy(): void {
    if (!this.enabled) {
      return;
    }

    this.scene.input.off('pointerdown', this.handlePointerDown);
    this.scene.input.off('pointermove', this.handlePointerMove);
    this.scene.input.off('pointerup', this.handlePointerUp);
  }
}
