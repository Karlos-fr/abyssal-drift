import Phaser from 'phaser';
import { SceneKey } from '../core/constants';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super(SceneKey.Boot);
  }

  public create(): void {
    this.scene.start(SceneKey.Menu);
  }
}
