import Phaser from 'phaser';

export class SubmarineEffects {
  private recoil = 0;
  private overshoot = 0;
  private previousThrust = 0;
  private impactKick = 0;
  private impactRoll = 0;

  public constructor(
    private readonly vessel: Phaser.GameObjects.Container,
    private readonly visualBody: Phaser.GameObjects.Container,
    private readonly headlightHalo: Phaser.GameObjects.Arc,
  ) {}

  public update(
    speedRatio: number,
    thrust: number,
    timeSeconds: number,
    deltaSeconds: number,
  ): void {
    const vibration = speedRatio * Math.sin(timeSeconds * 32) * 0.35;
    this.vessel.setScale(1, 1 + vibration * 0.002);

    const thrustDelta = thrust - this.previousThrust;
    this.previousThrust = thrust;

    // A short local recoil makes throttle changes readable without modifying
    // collision coordinates or actual physics.
    if (Math.abs(thrustDelta) > 0.04) {
      this.recoil -= thrustDelta * 1.25;
      this.overshoot += thrustDelta * 0.032;
    }

    this.recoil = Phaser.Math.Linear(
      this.recoil,
      -thrust * speedRatio * 0.65,
      1 - Math.exp(-9 * deltaSeconds),
    );
    this.overshoot = Phaser.Math.Linear(
      this.overshoot,
      0,
      1 - Math.exp(-6.5 * deltaSeconds),
    );

    this.impactKick = Phaser.Math.Linear(
      this.impactKick,
      0,
      1 - Math.exp(-10 * deltaSeconds),
    );
    this.impactRoll = Phaser.Math.Linear(
      this.impactRoll,
      0,
      1 - Math.exp(-8 * deltaSeconds),
    );

    this.visualBody.setPosition(
      Phaser.Math.Clamp(this.recoil + this.impactKick, -3.2, 3.2),
      Math.sin(timeSeconds * 42) * Math.abs(this.impactRoll) * 0.7,
    );
    this.visualBody.setRotation(
      Phaser.Math.Clamp(
        this.overshoot + this.impactRoll,
        -0.065,
        0.065,
      ),
    );

    const flicker =
      Math.sin(timeSeconds * 11.7) * 0.018 +
      Math.sin(timeSeconds * 23.3) * 0.009;
    this.headlightHalo.setAlpha(0.11 + flicker);
  }

  public triggerImpact(
    strength: number,
    hitHorizontal: boolean,
    hitVertical: boolean,
  ): void {
    const normalized = Phaser.Math.Clamp(strength, 0, 1);
    this.impactKick +=
      (hitHorizontal ? -1 : 0) * (0.8 + normalized * 1.8);
    this.impactRoll +=
      (hitVertical ? Phaser.Math.RND.sign() : Phaser.Math.RND.sign() * 0.45) *
      (0.012 + normalized * 0.035);
  }
}
