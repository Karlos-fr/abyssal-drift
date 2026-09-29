import Phaser from 'phaser';
import { Palette } from '../core/Palette';

export class EnvironmentArtSystem {
  public constructor(scene: Phaser.Scene) {
    this.createSeabed(scene);
    this.createWreck(scene);
    this.createStructure(scene);
    this.createInteractiveProps(scene);
  }

  private createSeabed(scene: Phaser.Scene): void {
    const g = scene.add.graphics().setDepth(-9);
    g.fillStyle(Palette.seabed, 0.9);
    g.fillRect(36, 812, 1_848, 30);
    g.fillStyle(Palette.rockHighlight, 0.35);
    for (let x = 50; x < 1_880; x += 27) {
      const h = 2 + ((x / 27) % 4);
      g.fillRect(x, 808 - h, 8, h);
    }
  }

  private createWreck(scene: Phaser.Scene): void {
    const wreck = scene.add.container(930, 470).setDepth(-2).setRotation(-0.08);
    const hull = scene.add.rectangle(0, 0, 72, 17, 0x34484a, 0.78);
    hull.setStrokeStyle(2, 0x18282b, 1);
    const brokenBow = scene.add.triangle(43, 0, 0, -8, 0, 8, 18, 2, 0x263a3d, 0.8);
    const cabin = scene.add.rectangle(-13, -13, 22, 10, 0x2c4143, 0.8);
    const mast = scene.add.rectangle(-9, -27, 2, 26, 0x31484a, 0.65);
    const windowA = scene.add.rectangle(-19, -13, 5, 3, 0x4b8587, 0.45);
    const windowB = scene.add.rectangle(-10, -13, 5, 3, 0x4b8587, 0.35);
    wreck.add([hull, brokenBow, cabin, mast, windowA, windowB]);
  }

  private createStructure(scene: Phaser.Scene): void {
    const structure = scene.add.container(1_335, 468).setDepth(-2);
    const base = scene.add.rectangle(0, 0, 58, 31, 0x27383c, 0.9);
    base.setStrokeStyle(2, 0x14252a, 1);
    const door = scene.add.rectangle(11, 4, 13, 21, 0x17282d, 1);
    const lamp = scene.add.circle(-18, -8, 2.5, Palette.hazard, 0.8);
    lamp.setBlendMode(Phaser.BlendModes.ADD);
    const antenna = scene.add.rectangle(-12, -24, 2, 18, 0x43575a, 0.7);
    structure.add([base, door, lamp, antenna]);
  }

  private createInteractiveProps(scene: Phaser.Scene): void {
    const positions = [
      { x: 955, y: 430 },
      { x: 1_385, y: 405 },
      { x: 1_785, y: 545 },
    ];

    for (const position of positions) {
      const prop = scene.add.container(position.x, position.y).setDepth(8);
      const casing = scene.add.rectangle(0, 0, 8, 10, 0x263d3d, 0.85);
      casing.setStrokeStyle(1, 0x101d20, 1);
      const indicator = scene.add.circle(0, -1, 1.4, Palette.interactive, 0.7);
      indicator.setBlendMode(Phaser.BlendModes.ADD);
      prop.add([casing, indicator]);

      scene.tweens.add({
        targets: indicator,
        alpha: 0.25,
        duration: 1_100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }
}
