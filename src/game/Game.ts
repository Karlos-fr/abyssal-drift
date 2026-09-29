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
    backgroundColor: '#03111f',
    pixelArt: true,
    roundPixels: true,
    render: {
      antialias: false,
    },
    scale: {
      // EXPAND fills the browser viewport while keeping the logical game
      // coordinates at 480x270. The camera gains a little extra visible area
      // on non-16:9 screens instead of letterboxing the game.
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [BootScene, MenuScene, OceanScene],
  };

  return new Phaser.Game(config);
}
