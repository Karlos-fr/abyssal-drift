import Phaser from 'phaser';

export class DebugOverlay {
  private readonly label: Phaser.GameObjects.Text;
  private elapsed = 0;

  public constructor(scene: Phaser.Scene) {
    this.label = scene.add
      .text(6, 6, 'FPS --', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#8de6d5',
        backgroundColor: '#00101699',
        padding: { x: 3, y: 2 },
      })
      .setScrollFactor(0)
      .setDepth(1_000);
  }

  public update(deltaMs: number, fps: number): void {
    this.elapsed += deltaMs;
    if (this.elapsed < 250) {
      return;
    }

    this.elapsed = 0;
    this.label.setText('FPS ' + Math.round(fps));
  }
}
