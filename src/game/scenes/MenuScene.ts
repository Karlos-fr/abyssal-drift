import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SceneKey } from '../core/constants';

export class MenuScene extends Phaser.Scene {
  private started = false;

  public constructor() {
    super(SceneKey.Menu);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#03111f');

    const backdrop = this.add.graphics();
    for (let y = 0; y < GAME_HEIGHT; y += 6) {
      const t = y / GAME_HEIGHT;
      const color = Phaser.Display.Color.Interpolate.RGBWithRGB(8, 55, 72, 2, 11, 22, 1, t);
      backdrop.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      backdrop.fillRect(0, y, GAME_WIDTH, 6);
    }

    this.add
      .text(GAME_WIDTH / 2, 86, 'ABYSSAL DRIFT', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#d7fbff',
        stroke: '#0c3e50',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 126, 'retro submarine exploration', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#72b8c4',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(GAME_WIDTH / 2, 190, 'ENTER / SPACE / TAP TO DIVE', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#b8edf4',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
    this.input.once('pointerdown', () => this.startGame());
  }

  private startGame(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.cameras.main.fadeOut(180, 2, 11, 22);
    this.time.delayedCall(190, () => this.scene.start(SceneKey.Ocean));
  }
}
