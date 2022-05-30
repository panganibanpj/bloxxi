import { Game as PhaserGame, AUTO as PHASER_RENDERER_AUTO } from 'Phaser';
import PlayState from '../states/PlayState';

export const BOARD_SIZE_WIDTH = 320;
export const BOARD_SIZE_HEIGHT = 480;

export default class Game extends PhaserGame {
  constructor(boardContainer) {
    super(
      BOARD_SIZE_WIDTH,
      BOARD_SIZE_HEIGHT,
      boardContainer,
      PHASER_RENDERER_AUTO,
    );
    
    this.state.add('play', PlayState);
    this.state.start('play');
  };
}
