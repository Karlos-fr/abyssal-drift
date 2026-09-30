import * as THREE from 'three';
import type Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  WATER_SURFACE_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../core/constants';
import {
  WATER_FRAGMENT_SHADER,
  WATER_VERTEX_SHADER,
} from './WaterShader';

export class WaterCompositor {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.Camera();
  private readonly material: THREE.ShaderMaterial;
  private readonly sceneTexture: THREE.CanvasTexture;
  private readonly sourceCanvas: HTMLCanvasElement;
  private readonly root: HTMLElement;
  private readonly touchUi: number;
  private timeSeconds = 0;
  private lastWidth = 0;
  private lastHeight = 0;
  private worldOriginX = 0;
  private worldOriginY = 0;
  private worldWidth = GAME_WIDTH;
  private worldHeight = GAME_HEIGHT;

  private readonly renderAfterPhaser = (): void => {
    this.render();
  };

  public constructor(
    private readonly game: Phaser.Game,
  ) {
    this.sourceCanvas = game.canvas;
    const root = document.getElementById('game-root');
    if (!root) {
      throw new Error('Missing #game-root for water compositor.');
    }
    this.root = root;
    this.touchUi =
      navigator.maxTouchPoints > 0 || 'ontouchstart' in window ? 1 : 0;

    this.sceneTexture = new THREE.CanvasTexture(this.sourceCanvas);
    this.sceneTexture.colorSpace = THREE.SRGBColorSpace;
    this.sceneTexture.minFilter = THREE.NearestFilter;
    this.sceneTexture.magFilter = THREE.NearestFilter;
    this.sceneTexture.generateMipmaps = false;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        u_sceneTex: { value: this.sceneTexture },
        u_time: { value: 0 },
        u_worldOrigin: { value: new THREE.Vector2() },
        u_worldSize: { value: new THREE.Vector2(GAME_WIDTH, GAME_HEIGHT) },
        u_worldExtent: {
          value: new THREE.Vector2(WORLD_WIDTH, WORLD_HEIGHT),
        },
        u_logicalSize: {
          value: new THREE.Vector2(GAME_WIDTH, GAME_HEIGHT),
        },
        u_surfaceY: { value: WATER_SURFACE_Y },
        u_cameraDepth: { value: 0 },
        u_touchUi: { value: this.touchUi },
      },
      vertexShader: WATER_VERTEX_SHADER,
      fragmentShader: WATER_FRAGMENT_SHADER,
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);

    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 1);

    const canvas = this.renderer.domElement;
    canvas.className = 'abyssal-water-canvas';
    canvas.style.position = 'fixed';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2';
    canvas.style.margin = '0';
    canvas.style.imageRendering = 'pixelated';

    this.root.appendChild(canvas);
    this.sourceCanvas.style.zIndex = '1';

    this.game.events.on('postrender', this.renderAfterPhaser);
    this.syncLayout();
  }

  public update(camera: Phaser.Cameras.Scene2D.Camera, deltaMs: number): void {
    this.timeSeconds += Math.min(deltaMs / 1_000, 1 / 20);

    const view = camera.worldView;
    this.worldOriginX = view.x;
    this.worldOriginY = view.y;
    this.worldWidth = view.width;
    this.worldHeight = view.height;

    const cameraCenterY = view.centerY;
    const cameraDepth = Math.max(
      0,
      Math.min(
        1,
        (cameraCenterY - WATER_SURFACE_Y) /
          (WORLD_HEIGHT - WATER_SURFACE_Y),
      ),
    );

    this.material.uniforms.u_time.value = this.timeSeconds;
    this.material.uniforms.u_worldOrigin.value.set(
      this.worldOriginX,
      this.worldOriginY,
    );
    this.material.uniforms.u_worldSize.value.set(
      this.worldWidth,
      this.worldHeight,
    );
    this.material.uniforms.u_cameraDepth.value = cameraDepth;

    this.syncLayout();
  }

  public destroy(): void {
    this.game.events.off('postrender', this.renderAfterPhaser);
    this.sceneTexture.dispose();
    this.material.dispose();

    for (const child of this.scene.children) {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private render(): void {
    if (!this.sourceCanvas.isConnected) {
      return;
    }

    this.ensureRendererSize();
    this.sceneTexture.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  private ensureRendererSize(): void {
    const width = this.sourceCanvas.width;
    const height = this.sourceCanvas.height;

    if (width === this.lastWidth && height === this.lastHeight) {
      return;
    }

    this.lastWidth = width;
    this.lastHeight = height;
    this.renderer.setSize(width, height, false);
  }

  private syncLayout(): void {
    const sourceRect = this.sourceCanvas.getBoundingClientRect();
    const rootRect = this.root.getBoundingClientRect();
    const canvas = this.renderer.domElement;

    canvas.style.left = `${sourceRect.left - rootRect.left}px`;
    canvas.style.top = `${sourceRect.top - rootRect.top}px`;
    canvas.style.width = `${sourceRect.width}px`;
    canvas.style.height = `${sourceRect.height}px`;
  }
}
