import { Group } from 'Phaser';
import Board from '../objects/Board';

export default class SinglePlayerGame extends Group {
  constructor() {
    super(...arguments);
    const board = new Board(this.game, this);
  }
}
