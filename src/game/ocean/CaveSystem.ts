import type Phaser from 'phaser';

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
    const ceiling = 58;
    const floor = 58;

    return [
      { x: 0, y: 0, width: worldWidth, height: ceiling },
      { x: 0, y: worldHeight - floor, width: worldWidth, height: floor },
      { x: 0, y: 0, width: edge, height: worldHeight },
      { x: worldWidth - edge, y: 0, width: edge, height: worldHeight },
      { x: 320, y: ceiling, width: 220, height: 190 },
      { x: 620, y: ceiling, width: 210, height: 270 },
      { x: 620, y: 520, width: 210, height: worldHeight - 520 },
      { x: 1_080, y: 370, width: 92, height: 98 },
      { x: 1_250, y: 505, width: 235, height: worldHeight - 505 },
      { x: 1_520, y: ceiling, width: 190, height: 245 },
      { x: 1_520, y: 625, width: 190, height: worldHeight - 625 },
      { x: 1_760, y: 305, width: 72, height: 180 },
    ];
  }

  private draw(scene: Phaser.Scene): void {
    const rock = scene.add.graphics().setDepth(-10);
    rock.fillStyle(0x061116, 1);

    for (const block of this.blocks) {
      rock.fillRect(block.x, block.y, block.width, block.height);
    }

    // Break the silhouette with small pixel chunks instead of repeating
    // triangular teeth. Collision geometry stays clean and predictable.
    rock.fillStyle(0x0d252c, 0.55);

    for (const block of this.blocks) {
      const horizontal = block.width >= block.height;

      if (horizontal) {
        const edgeY =
          block.y < 100 ? block.y + block.height : block.y;

        for (
          let x = block.x + 14, index = 0;
          x < block.x + block.width - 14;
          x += 30, index += 1
        ) {
          const width = 10 + (index % 3) * 4;
          const height = 2 + ((index * 5) % 5);
          rock.fillRect(
            x,
            block.y < 100 ? edgeY : edgeY - height,
            width,
            height,
          );
        }
      } else {
        for (
          let y = block.y + 18, index = 0;
          y < block.y + block.height - 18;
          y += 34, index += 1
        ) {
          const width = 2 + ((index * 3) % 4);
          const height = 10 + (index % 3) * 3;
          rock.fillRect(block.x - width, y, width, height);
          rock.fillRect(block.x + block.width, y + 8, width, height);
        }
      }
    }

    rock.fillStyle(0x16363d, 0.18);
    for (let x = 80; x < 1_850; x += 97) {
      rock.fillRect(x, 846 - ((x / 97) % 3) * 3, 15, 2);
    }
  }
}
