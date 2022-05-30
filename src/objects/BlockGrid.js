import { Group } from 'Phaser';
import Block from '../objects/Block';

export function pixelCoordinatesForPosition(x, y) {
  //Account for offset (rise)
  return {
    x: x * 64,
    y: y * 64,
  };
}

export default class BlockGrid extends Group {
  constructor(game) {
    super(...arguments);
    this.name = 'grid';
    this.classType = Block;
    this.inputEnableChildren = true;
  }
  getBlockAtPosition(x, y) {
    return this.children.find(block => block instanceof Block && block.data.positionX === x && block.data.positionY === y);
  }
  createBlock(positionY, positionX, blockType, blockPhase, width, height) {
    const blockAtPosition = this.getBlockAtPosition(positionX, positionY);
    
    if (blockAtPosition) {
      //Something's wrong, block already exists here!
    } else {
      const pixelCoordinates = pixelCoordinatesForPosition(positionX, positionY);
      this.create(pixelCoordinates.x, pixelCoordinates.y, {
        blockType,
        blockPhase,
        width,
        height,
        positionX,
        positionY
      });
    }
  }
}
