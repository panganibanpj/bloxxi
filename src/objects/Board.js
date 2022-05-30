import { Group } from 'Phaser';
import BlockGrid from '../objects/BlockGrid';
import Swapper from '../objects/Swapper';

export default class Board extends Group {
  constructor() {
    super(...arguments);

    const grid = new BlockGrid(this.game, this);
    const swapper = new Swapper(this.game, this);

    swapper.attachToBlockGrid(grid);

    for (var i = 0; i < 7; i++) {
      for (var j = 0; j < 5; j++) {
        grid.createBlock(i, j);
      }
    }
  }
}
