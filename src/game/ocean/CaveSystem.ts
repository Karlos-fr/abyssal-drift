import Phaser from 'phaser';

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

/**
 * A deliberately simple block-based cave.
 *
 * Collision geometry is kept independent from the decorative ridges so the
 * first milestone stays deterministic and easy to tune. Later art can replace
 * the blocks without rewriting collision handling.
 */
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

    // A few passes safely resolve corners where two cave blocks meet.
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
      // World shell.
      { x: 0, y: 0, width: worldWidth, height: ceiling },
      { x: 0, y: worldHeight - floor, width: worldWidth, height: floor },
      { x: 0, y: 0, width: edge, height: worldHeight },
      { x: worldWidth - edge, y: 0, width: edge, height: worldHeight },

      // A first ceiling shelf forces the player to dive.
      { x: 320, y: ceiling, width: 220, height: 190 },

      // A narrower tunnel introduces controlled precision.
      { x: 620, y: ceiling, width: 210, height: 270 },
      { x: 620, y: 520, width: 210, height: worldHeight - 520 },

      // The middle is an open chamber with one isolated rock.
      { x: 1_080, y: 370, width: 92, height: 98 },

      // A raised seabed asks the player to climb again.
      { x: 1_250, y: 505, width: 235, height: worldHeight - 505 },

      // Final mixed-depth passage.
      { x: 1_520, y: ceiling, width: 190, height: 245 },
      { x: 1_520, y: 625, width: 190, height: worldHeight - 625 },

      // A last obstacle before the far wall.
      { x: 1_760, y: 305, width: 72, height: 180 },
    ];
  }

  private draw(scene: Phaser.Scene): void {
    const rock = scene.add.graphics().setDepth(-10);
    rock.fillStyle(0x071218, 1);

    for (const block of this.blocks) {
      rock.fillRect(block.x, block.y, block.width, block.height);
    }

    // Small ridges break the rectangular silhouette while collision remains
    // simple and predictable.
    rock.fillStyle(0x0b2026, 1);
    for (const block of this.blocks) {
      if (block.width < 90) {
        continue;
      }

      const ridgeY = block.y === 0 ? block.height : block.y;
      for (let x = block.x + 8; x < block.x + block.width - 10; x += 34) {
        const pointsUp = block.y > 100;
        if (pointsUp) {
          rock.fillTriangle(x, ridgeY, x + 12, ridgeY - 10, x + 25, ridgeY);
        } else {
          rock.fillTriangle(x, ridgeY, x + 12, ridgeY + 10, x + 25, ridgeY);
        }
      }
    }
  }
}
