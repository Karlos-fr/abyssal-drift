import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './core/constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { OceanScene } from './scenes/OceanScene';

export function createGame(): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-root',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#020912',
    pixelArt: true,
    roundPixels: true,
    render: {
      antialias: false,
    },
    scale: {
      // EXPAND lets the game occupy the whole viewport while Phaser controls
      // the canvas dimensions. CSS no longer stretches the backing buffer.
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [BootScene, MenuScene, OceanScene],
  };

  return new Phaser.Game(config);
}
