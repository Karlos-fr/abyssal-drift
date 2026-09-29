import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SceneKey,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../core/constants';
import { DebugOverlay } from '../debug/DebugOverlay';
import { InputController } from '../input/InputController';
import { Submarine } from '../submarine/Submarine';

export class OceanScene extends Phaser.Scene {
  private submarine!: Submarine;
  private controls!: InputController;
  private debugOverlay!: DebugOverlay;

  public constructor() {
    super(SceneKey.Ocean);
  }

  public create(): void {
    this.cameras.main.fadeIn(220, 2, 11, 22);
    this.createOceanBackdrop();

    this.submarine = new Submarine(this, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.controls = new InputController(this);
    this.debugOverlay = new DebugOverlay(this);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.submarine, true, 0.08, 0.08);
    camera.setFollowOffset(-34, 0);

    this.add
      .text(8, GAME_HEIGHT - 17, 'ARROWS / ZQSD / WASD  ·  MOVE', {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#76aeb7',
      })
      .setScrollFactor(0)
      .setDepth(1_000);
  }

  public update(_time: number, delta: number): void {
    const movement = this.controls.readMovement();
    this.submarine.updateFromInput(movement, delta);
    this.debugOverlay.update(delta, this.game.loop.actualFps);
  }

  private createOceanBackdrop(): void {
    this.cameras.main.setBackgroundColor('#03111f');

    const background = this.add.graphics().setDepth(-100);
    const stripeHeight = 24;
    for (let y = 0; y < WORLD_HEIGHT; y += stripeHeight) {
      const t = y / WORLD_HEIGHT;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 8, g: 63, b: 77 },
        { r: 1, g: 8, b: 18 },
        1,
        t,
      );
      background.fillStyle(
        Phaser.Display.Color.GetColor(color.r, color.g, color.b),
        1,
      );
      background.fillRect(0, y, WORLD_WIDTH, stripeHeight + 1);
    }

    const particles = this.add.graphics().setDepth(-50);
    particles.fillStyle(0xa7dbe0, 0.16);
    const random = new Phaser.Math.RandomDataGenerator([
      'abyssal-drift-ocean',
    ]);

    for (let index = 0; index < 280; index += 1) {
      const x = random.between(0, WORLD_WIDTH);
      const y = random.between(20, WORLD_HEIGHT - 20);
      const radius = random.realInRange(0.35, 1.15);
      particles.fillCircle(x, y, radius);
    }

    const floor = this.add.graphics().setDepth(-20);
    floor.fillStyle(0x061017, 1);
    floor.fillRect(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50);
    floor.fillStyle(0x0b1b22, 1);

    for (let x = 0; x < WORLD_WIDTH; x += 48) {
      floor.fillTriangle(
        x,
        WORLD_HEIGHT - 50,
        x + 28,
        WORLD_HEIGHT - 68,
        x + 62,
        WORLD_HEIGHT - 50,
      );
    }
  }
}
