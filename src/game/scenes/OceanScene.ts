import Phaser from 'phaser';
import { AudioSystem } from '../audio/AudioSystem';
import {
  GAME_HEIGHT,
  SceneKey,
  WATER_SURFACE_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../core/constants';
import { DebugOverlay } from '../debug/DebugOverlay';
import { BubbleSystem } from '../effects/BubbleSystem';
import { DynamicLightSystem } from '../effects/DynamicLightSystem';
import { ImpactEffectSystem } from '../effects/ImpactEffectSystem';
import { ParticleField } from '../effects/ParticleField';
import { InputController } from '../input/InputController';
import { CaveSystem } from '../ocean/CaveSystem';
import { DepthSystem } from '../ocean/DepthSystem';
import { EnvironmentArtSystem } from '../ocean/EnvironmentArtSystem';
import { MarineLifeSystem } from '../ocean/MarineLifeSystem';
import { OceanAmbienceSystem } from '../ocean/OceanAmbienceSystem';
import { SonarSystem } from '../sonar/SonarSystem';
import { Submarine } from '../submarine/Submarine';
import { WaterCompositor } from '../water/WaterCompositor';

const SHOW_DEBUG = false;
const SHOW_DESKTOP_HELP = false;

export class OceanScene extends Phaser.Scene {
  private audio!: AudioSystem;
  private submarine!: Submarine;
  private controls!: InputController;
  private debugOverlay!: DebugOverlay;
  private cave!: CaveSystem;
  private depthSystem!: DepthSystem;
  private ambience!: OceanAmbienceSystem;
  private marineLife!: MarineLifeSystem;
  private bubbles!: BubbleSystem;
  private particles!: ParticleField;
  private impacts!: ImpactEffectSystem;
  private dynamicLight!: DynamicLightSystem;
  private water!: WaterCompositor;
  private sonar!: SonarSystem;
  private cameraTarget!: Phaser.GameObjects.Zone;
  private cameraLookAhead = 0;
  private cameraThrustKick = 0;
  private previousHorizontalVelocity = 0;
  private previousVerticalInput = 0;

  public constructor() {
    super(SceneKey.Ocean);
  }

  public create(): void {
    this.cameras.main.fadeIn(220, 2, 11, 22);
    this.createWorldBackdrop();
    this.ambience = new OceanAmbienceSystem(this);
    new EnvironmentArtSystem(this);
    this.marineLife = new MarineLifeSystem(this);

    this.audio = new AudioSystem();
    this.particles = new ParticleField(this);
    this.cave = new CaveSystem(this, WORLD_WIDTH, WORLD_HEIGHT);
    this.depthSystem = new DepthSystem(this);
    this.sonar = new SonarSystem(this);
    this.submarine = new Submarine(this, 190, 220);
    this.dynamicLight = new DynamicLightSystem(
      this,
      this.cave.getCollisionBlocks(),
    );
    this.bubbles = new BubbleSystem(this);
    this.impacts = new ImpactEffectSystem(this);
    this.controls = new InputController(this);
    this.debugOverlay = new DebugOverlay(this, SHOW_DEBUG);
    this.water = new WaterCompositor(this.game);

    this.input.keyboard?.once('keydown', () => this.audio.unlock());
    this.input.once('pointerdown', () => this.audio.unlock());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audio.dispose();
      this.water.destroy();
    });

    this.cameraTarget = this.add.zone(
      this.submarine.x,
      this.submarine.y,
      1,
      1,
    );

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.cameraTarget, true, 0.075, 0.075);

    if (!this.controls.isTouchEnabled && SHOW_DESKTOP_HELP) {
      this.add
        .text(
          10,
          GAME_HEIGHT - 20,
          'ARROWS / ZQSD / WASD · MOVE   SPACE · SONAR',
          {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#76aeb7',
          },
        )
        .setScrollFactor(0)
        .setDepth(1_000);
    }
  }

  public update(_time: number, delta: number): void {
    const movement = this.controls.readMovement();

    if (
      Math.abs(movement.vertical) > 0.35 &&
      Math.abs(this.previousVerticalInput) <= 0.35
    ) {
      this.audio.playBallast(movement.vertical);
    }

    this.previousVerticalInput = movement.vertical;
    this.submarine.updateFromInput(movement, delta);

    const preCollisionMotion = this.submarine.motion;
    const collision = this.cave.resolve(
      this.submarine.x,
      this.submarine.y,
      this.submarine.collisionHalfWidth,
      this.submarine.collisionHalfHeight,
    );

    if (collision.hitHorizontal || collision.hitVertical) {
      const impactStrength = Math.max(
        collision.hitHorizontal ? Math.abs(preCollisionMotion.velocityX) : 0,
        collision.hitVertical ? Math.abs(preCollisionMotion.velocityY) : 0,
      );

      this.submarine.resolveCollision(
        collision.x,
        collision.y,
        collision.hitHorizontal,
        collision.hitVertical,
      );

      if (impactStrength > 6) {
        this.triggerImpact(
          impactStrength,
          collision.hitHorizontal,
          collision.hitVertical,
        );
      }
    }

    if (
      this.controls.readSonarPressed() &&
      this.sonar.trigger(this.submarine.x, this.submarine.y)
    ) {
      this.cameras.main.shake(65, 0.0012);
      this.audio.playSonar(this.depthSystem.depth);
      this.marineLife.triggerSonar();
    }

    this.ambience.update(delta);
    this.marineLife.update(this.submarine, this.dynamicLight, delta);
    this.audio.updateEngine(this.submarine.motion, this.depthSystem.depth);
    this.audio.updateDepth(delta, this.depthSystem.depth);
    this.bubbles.update(this.submarine, this.submarine.motion, delta);
    this.particles.update(
      this.submarine,
      this.submarine.motion,
      delta,
      this.dynamicLight,
      this.depthSystem.depth,
    );
    this.impacts.update(delta);
    this.sonar.update(delta);
    this.depthSystem.update(this.submarine.y);
    this.dynamicLight.update(this.submarine, delta, this.depthSystem.depth);
    this.updateCameraLookAhead(delta);
    this.water.update(this.cameras.main, delta);
    this.debugOverlay.update(delta, this.game.loop.actualFps);
  }

  private triggerImpact(
    impactStrength: number,
    hitHorizontal: boolean,
    hitVertical: boolean,
  ): void {
    const normalized = Phaser.Math.Clamp(impactStrength / 72, 0, 1);

    this.impacts.trigger(
      this.submarine.x,
      this.submarine.y,
      impactStrength,
      hitHorizontal,
      hitVertical,
    );
    this.submarine.triggerImpact(
      normalized,
      hitHorizontal,
      hitVertical,
    );
    this.dynamicLight.triggerImpact(normalized);
    this.debugOverlay.triggerImpact(normalized);
    this.audio.playImpact(impactStrength);
    this.bubbles.burstAt(
      this.submarine.x,
      this.submarine.y,
      Math.round(4 + normalized * 9),
    );

    this.cameras.main.shake(
      Math.round(55 + normalized * 85),
      0.001 + normalized * 0.0035,
    );
  }

  private updateCameraLookAhead(deltaMs: number): void {
    const deltaSeconds = Math.min(deltaMs / 1_000, 1 / 20);
    const velocityX = this.submarine.motion.velocityX;
    const acceleration =
      (velocityX - this.previousHorizontalVelocity) /
      Math.max(deltaSeconds, 0.001);
    this.previousHorizontalVelocity = velocityX;

    const targetLookAhead = Phaser.Math.Clamp(
      velocityX * 0.72,
      -62,
      62,
    );

    this.cameraLookAhead = Phaser.Math.Linear(
      this.cameraLookAhead,
      targetLookAhead,
      1 - Math.exp(-3.1 * deltaSeconds),
    );

    this.cameraThrustKick += Phaser.Math.Clamp(
      -acceleration * deltaSeconds * 0.035,
      -1.2,
      1.2,
    );
    this.cameraThrustKick = Phaser.Math.Linear(
      this.cameraThrustKick,
      0,
      1 - Math.exp(-8 * deltaSeconds),
    );

    this.cameraTarget.setPosition(
      this.submarine.x + this.cameraLookAhead + this.cameraThrustKick,
      this.submarine.y + this.submarine.motion.velocityY * 0.12,
    );
  }

  private createWorldBackdrop(): void {
    this.cameras.main.setBackgroundColor('#7fc2d9');

    const background = this.add.graphics().setDepth(-100);
    const skyBands = 24;

    for (let index = 0; index < skyBands; index += 1) {
      const t = index / (skyBands - 1);
      const color = Phaser.Display.Color.Interpolate.RGBWithRGB(
        86,
        160,
        191,
        192,
        226,
        232,
        1,
        t,
      );

      background.fillStyle(
        Phaser.Display.Color.GetColor(color.r, color.g, color.b),
        1,
      );

      background.fillRect(
        0,
        (WATER_SURFACE_Y / skyBands) * index,
        WORLD_WIDTH,
        WATER_SURFACE_Y / skyBands + 1,
      );
    }

    background.fillStyle(0x163943, 1);
    background.fillRect(
      0,
      WATER_SURFACE_Y,
      WORLD_WIDTH,
      WORLD_HEIGHT - WATER_SURFACE_Y,
    );

    background.fillStyle(0xe8f4eb, 0.5);
    background.fillCircle(1_560, 54, 24);

    background.fillStyle(0xffffff, 0.18);
    background.fillEllipse(330, 54, 150, 18);
    background.fillEllipse(1_030, 72, 190, 22);
  }
}
