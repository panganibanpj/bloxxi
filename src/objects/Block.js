import { Sprite, Graphics, Text, CENTER } from 'Phaser';

const BLOCK_TYPES = ['A', 'B', 'C', 'D', 'E', 'F'];

class BlockText extends Text {
  constructor(game, blockType) {
    super(game, 0, 0, blockType, {
      fontSize: 64,
      fill: 'transparent',
      stroke: 'black',
      strokeThickness: 2,
    });
  }
}

class BlockGraphic extends Graphics {
  constructor(game, blockType) {
    super(game, 0, 0);
    this.beginFill(0xffffff);
    this.drawRoundedRect(0, 0, 64, 64, 9);
    this.endFill();
    const text = new BlockText(game, blockType);
    this.addChild(text);
    text.alignIn(this, CENTER);
    this.setType(blockType);
  }
  setType(blockType) {
    switch(blockType) {
      case 'A':
        this.tint = 0xff0000;
        break;
      case 'B':
        this.tint = 0x0000ff;
        break;
      case 'C':
        this.tint = 0x00ffff;
        break;
      case 'D':
        this.tint = 0x00ff00;
        break;
      case 'E':
        this.tint = 0xffff00;
        break;
      case 'F':
        this.tint = 0xff00ff;
        break;
      default:
        this.tint = 0xffffff;
        break;
    }
  }
}

export default class Block extends Sprite {
  constructor(game, x, y, data) {
    const {
      blockType = Block.randomBlockType(),
      // blockPhase = BLOCK_SPRITE__PHASE.STEADY,
      width = 1,
      height = 1,
    } = data;

    super(
      game,
      x,
      y,
    );
    
    const blockGraphic = new BlockGraphic(this.game, blockType);
    this.addChild(blockGraphic);
    this.width = 1;
    this.height = 1;

    this.data = data;
  }

  static randomBlockType() {
    const randomIndex = Math.floor(Math.random() * BLOCK_TYPES.length);
    return BLOCK_TYPES[randomIndex];
  }
}
