import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SceneKey,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../core/constants';
import { DebugOverlay } from '../debug/DebugOverlay';
import { BubbleSystem } from '../effects/BubbleSystem';
import { InputController } from '../input/InputController';
import { CaveSystem } from '../ocean/CaveSystem';
import { Submarine } from '../submarine/Submarine';

export class OceanScene extends Phaser.Scene {
  private submarine!: Submarine;
  private controls!: InputController;
  private debugOverlay!: DebugOverlay;
  private cave!: CaveSystem;
  private bubbles!: BubbleSystem;
  private cameraTarget!: Phaser.GameObjects.Zone;
  private cameraLookAhead = 0;

  public constructor() {
    super(SceneKey.Ocean);
  }

  public create(): void {
    this.cameras.main.fadeIn(220, 2, 11, 22);
    this.createOceanBackdrop();

    this.cave = new CaveSystem(this, WORLD_WIDTH, WORLD_HEIGHT);
    this.submarine = new Submarine(this, 190, 170);
    this.bubbles = new BubbleSystem(this);
    this.controls = new InputController(this);
    this.debugOverlay = new DebugOverlay(this);

    this.cameraTarget = this.add.zone(
      this.submarine.x,
      this.submarine.y,
      1,
      1,
    );

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.cameraTarget, true, 0.08, 0.08);

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

    const collision = this.cave.resolve(
      this.submarine.x,
      this.submarine.y,
      this.submarine.collisionHalfWidth,
      this.submarine.collisionHalfHeight,
    );

    if (collision.hitHorizontal || collision.hitVertical) {
      this.submarine.resolveCollision(
        collision.x,
        collision.y,
        collision.hitHorizontal,
        collision.hitVertical,
      );
    }

    this.bubbles.update(this.submarine, this.submarine.motion, delta);
    this.updateCameraLookAhead(delta);
    this.debugOverlay.update(delta, this.game.loop.actualFps);
  }

  private updateCameraLookAhead(deltaMs: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    const targetLookAhead = Phaser.Math.Clamp(
      this.submarine.motion.velocityX * 0.62,
      -46,
      46,
    );

    this.cameraLookAhead = Phaser.Math.Linear(
      this.cameraLookAhead,
      targetLookAhead,
      1 - Math.exp(-3.5 * deltaSeconds),
    );

    this.cameraTarget.setPosition(
      this.submarine.x + this.cameraLookAhead,
      this.submarine.y + this.submarine.motion.velocityY * 0.12,
    );
  }

  private createOceanBackdrop(): void {
    this.cameras.main.setBackgroundColor('#03111f');

    const background = this.add.graphics().setDepth(-100);
    const stripeHeight = 24;
    for (let y = 0; y < WORLD_HEIGHT; y += stripeHeight) {
      const t = y / WORLD_HEIGHT;
      const color = Phaser.Display.Color.Interpolate.RGBWithRGB(
        8,
        63,
        77,
        1,
        8,
        18,
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
  }
}
