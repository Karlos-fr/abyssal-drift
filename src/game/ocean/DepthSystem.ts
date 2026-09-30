import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  WATER_SURFACE_Y,
  WORLD_HEIGHT,
} from '../core/constants';

export type DepthZone = 'safe' | 'warning' | 'pressure';

const WARNING_DEPTH = 0.66;
const PRESSURE_DEPTH = 0.84;

export class DepthSystem {
  private readonly pressureVignette: Phaser.GameObjects.Graphics;
  private readonly zoneLabel: Phaser.GameObjects.Text;
  private normalizedDepth = 0;
  private currentZone: DepthZone = 'safe';

  public constructor(scene: Phaser.Scene) {
    this.pressureVignette = scene.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(900)
      .setAlpha(0);

    for (let inset = 0; inset < 24; inset += 4) {
      const alpha = (1 - inset / 24) * 0.028;
      this.pressureVignette.lineStyle(5, 0x071018, alpha);
      this.pressureVignette.strokeRect(
        inset,
        inset,
        GAME_WIDTH - inset * 2,
        GAME_HEIGHT - inset * 2,
      );
    }

    this.zoneLabel = scene.add
      .text(GAME_WIDTH / 2, 14, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#d7fbff',
        backgroundColor: '#001016aa',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1_100)
      .setVisible(false);
  }

  public get depth(): number {
    return this.normalizedDepth;
  }

  public get zone(): DepthZone {
    return this.currentZone;
  }

  public get pressureAmount(): number {
    return Phaser.Math.Clamp(
      (this.normalizedDepth - PRESSURE_DEPTH) / (1 - PRESSURE_DEPTH),
      0,
      1,
    );
  }

  public update(worldY: number): void {
    this.normalizedDepth = Phaser.Math.Clamp(
      (worldY - WATER_SURFACE_Y) /
        (WORLD_HEIGHT - WATER_SURFACE_Y - 58),
      0,
      1,
    );

    const nextZone: DepthZone =
      this.normalizedDepth >= PRESSURE_DEPTH
        ? 'pressure'
        : this.normalizedDepth >= WARNING_DEPTH
          ? 'warning'
          : 'safe';

    if (nextZone !== this.currentZone) {
      this.currentZone = nextZone;
      this.updateZoneLabel();
    }

    this.pressureVignette.setAlpha(this.pressureAmount * 0.78);

    if (this.currentZone === 'warning') {
      this.zoneLabel.setAlpha(
        0.72 + Math.sin(performance.now() * 0.006) * 0.18,
      );
    } else if (this.currentZone === 'pressure') {
      this.zoneLabel.setAlpha(
        0.78 + Math.sin(performance.now() * 0.011) * 0.2,
      );
    }
  }

  private updateZoneLabel(): void {
    if (this.currentZone === 'safe') {
      this.zoneLabel.setVisible(false);
      return;
    }

    if (this.currentZone === 'warning') {
      this.zoneLabel
        .setText('DEPTH WARNING')
        .setColor('#f1d68b')
        .setVisible(true);
      return;
    }

    this.zoneLabel
      .setText('HULL PRESSURE')
      .setColor('#ffb2a0')
      .setVisible(true);
  }
}
