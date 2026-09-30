import Phaser from 'phaser';

export class DebugOverlay {
  private readonly label: Phaser.GameObjects.Text;
  private readonly enabled: boolean;
  private elapsed = 0;
  private impactTime = 0;
  private impactStrength = 0;

  public constructor(scene: Phaser.Scene, enabled = false) {
    this.enabled = enabled;
    this.label = scene.add
      .text(8, 8, 'FPS --', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8de6d5',
        backgroundColor: '#00101699',
        padding: { x: 3, y: 2 },
      })
      .setScrollFactor(0)
      .setDepth(1_000)
      .setVisible(enabled);
  }

  public update(deltaMs: number, fps: number): void {
    if (!this.enabled) {
      return;
    }

    this.elapsed += deltaMs;
    this.impactTime = Math.max(0, this.impactTime - deltaMs);

    if (this.impactTime > 0) {
      const progress = this.impactTime / 180;
      const shake = Math.sin(this.impactTime * 0.16) * this.impactStrength * 1.3;
      this.label
        .setPosition(8 + shake, 8)
        .setAlpha(0.72 + progress * 0.28);
    } else {
      this.label.setPosition(8, 8).setAlpha(1);
    }

    if (this.elapsed < 250) {
      return;
    }

    this.elapsed = 0;
    this.label.setText('FPS ' + Math.round(fps));
  }

  public triggerImpact(strength: number): void {
    if (!this.enabled) {
      return;
    }

    this.impactStrength = Phaser.Math.Clamp(strength, 0, 1);
    this.impactTime = 180;
  }
}
