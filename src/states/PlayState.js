import { State } from 'Phaser';
// import BlockFactory from 'objects/BlockFactory';
import SinglePlayerGame from '../objects/SinglePlayerGame';

export default class PlayState extends State {
  create() {
    const mainGroup = this.add.group(this.world, 'main');
    const singlePlayerGame = new SinglePlayerGame(this.game);
    
    // var blocks = new BlockFactory(this);
    // var cursorContainer = this.add.group(mainGroup, 'cursor container');
    
    mainGroup.add(singlePlayerGame);
  }
}
