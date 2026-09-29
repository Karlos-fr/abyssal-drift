import Phaser from 'phaser';

export interface MovementInput {
  horizontal: number;
  vertical: number;
}

export class InputController {
  private readonly left: Phaser.Input.Keyboard.Key;
  private readonly right: Phaser.Input.Keyboard.Key;
  private readonly up: Phaser.Input.Keyboard.Key;
  private readonly down: Phaser.Input.Keyboard.Key;
  private readonly q: Phaser.Input.Keyboard.Key;
  private readonly d: Phaser.Input.Keyboard.Key;
  private readonly z: Phaser.Input.Keyboard.Key;
  private readonly s: Phaser.Input.Keyboard.Key;
  private readonly a: Phaser.Input.Keyboard.Key;
  private readonly w: Phaser.Input.Keyboard.Key;

  public constructor(scene: Phaser.Scene) {
    if (!scene.input.keyboard) {
      throw new Error('Keyboard input is unavailable in this environment.');
    }

    const keyboard = scene.input.keyboard;
    this.left = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.right = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.up = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.down = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.q = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.d = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.z = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.s = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.a = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.w = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  }

  public readMovement(): MovementInput {
    const horizontal =
      Number(this.right.isDown || this.d.isDown) -
      Number(this.left.isDown || this.q.isDown || this.a.isDown);
    const vertical =
      Number(this.down.isDown || this.s.isDown) -
      Number(this.up.isDown || this.z.isDown || this.w.isDown);

    return { horizontal, vertical };
  }
}
