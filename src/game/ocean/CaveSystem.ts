import type Phaser from 'phaser';
import { WATER_SURFACE_Y } from '../core/constants';

export interface CaveCollisionResult {
  x: number;
  y: number;
  hitHorizontal: boolean;
  hitVertical: boolean;
}

export interface CaveBlock {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class CaveSystem {
  private readonly blocks: CaveBlock[];

  public constructor(
    scene: Phaser.Scene,
    worldWidth: number,
    worldHeight: number,
  ) {
    this.blocks = this.createLayout(worldWidth, worldHeight);
    this.draw(scene);
  }

  public getCollisionBlocks(): readonly CaveBlock[] {
    return this.blocks;
  }

  public resolve(
    x: number,
    y: number,
    halfWidth: number,
    halfHeight: number,
  ): CaveCollisionResult {
    let resolvedX = x;
    let resolvedY = y;
    let hitHorizontal = false;
    let hitVertical = false;

    for (let pass = 0; pass < 3; pass += 1) {
      let changed = false;

      for (const block of this.blocks) {
        const left = block.x;
        const right = block.x + block.width;
        const top = block.y;
        const bottom = block.y + block.height;

        if (
          resolvedX + halfWidth <= left ||
          resolvedX - halfWidth >= right ||
          resolvedY + halfHeight <= top ||
          resolvedY - halfHeight >= bottom
        ) {
          continue;
        }

        const overlapLeft = resolvedX + halfWidth - left;
        const overlapRight = right - (resolvedX - halfWidth);
        const overlapTop = resolvedY + halfHeight - top;
        const overlapBottom = bottom - (resolvedY - halfHeight);
        const overlapX = Math.min(overlapLeft, overlapRight);
        const overlapY = Math.min(overlapTop, overlapBottom);

        if (overlapX < overlapY) {
          resolvedX +=
            resolvedX < left + block.width * 0.5 ? -overlapLeft : overlapRight;
          hitHorizontal = true;
        } else {
          resolvedY +=
            resolvedY < top + block.height * 0.5 ? -overlapTop : overlapBottom;
          hitVertical = true;
        }

        changed = true;
      }

      if (!changed) {
        break;
      }
    }

    return {
      x: resolvedX,
      y: resolvedY,
      hitHorizontal,
      hitVertical,
    };
  }

  private createLayout(worldWidth: number, worldHeight: number): CaveBlock[] {
    const edge = 36;
    const floor = 58;

    return [
      { x: 0, y: 0, width: edge, height: worldHeight },
      { x: worldWidth - edge, y: 0, width: edge, height: worldHeight },
      { x: 0, y: worldHeight - floor, width: worldWidth, height: floor },

      // Open water occupies the whole top of the level. Submerged rock shelves
      // begin well below the physical water surface.
      { x: 330, y: 610, width: 225, height: worldHeight - 610 },
      { x: 620, y: WATER_SURFACE_Y + 145, width: 215, height: 178 },
      { x: 620, y: 622, width: 215, height: worldHeight - 622 },
      { x: 1_070, y: 430, width: 108, height: 118 },
      { x: 1_245, y: 565, width: 245, height: worldHeight - 565 },
      { x: 1_515, y: WATER_SURFACE_Y + 165, width: 198, height: 180 },
      { x: 1_515, y: 680, width: 198, height: worldHeight - 680 },
      { x: 1_760, y: 420, width: 74, height: 178 },
    ];
  }

  private draw(scene: Phaser.Scene): void {
    const rock = scene.add.graphics().setDepth(-10);
    rock.fillStyle(0x071116, 1);

    for (const block of this.blocks) {
      rock.fillRect(block.x, block.y, block.width, block.height);
    }

    rock.fillStyle(0x123038, 0.48);

    for (const block of this.blocks) {
      const horizontal = block.width >= block.height;

      if (horizontal) {
        for (
          let x = block.x + 16, index = 0;
          x < block.x + block.width - 16;
          x += 34, index += 1
        ) {
          const width = 9 + (index % 3) * 4;
          const height = 2 + ((index * 5) % 5);
          rock.fillRect(x, block.y - height, width, height);
        }
      } else {
        for (
          let y = block.y + 20, index = 0;
          y < block.y + block.height - 20;
          y += 38, index += 1
        ) {
          const width = 2 + ((index * 3) % 4);
          const height = 10 + (index % 3) * 3;
          rock.fillRect(block.x - width, y, width, height);
          rock.fillRect(block.x + block.width, y + 7, width, height);
        }
      }
    }
  }
}
