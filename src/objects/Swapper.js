import { Group, Point } from 'Phaser';
import last from 'lodash/last';
import { pixelCoordinatesForPosition } from '../objects/BlockGrid';

function blocksAreAdjacent(blockA, blockB) {
  const {
    positionX: aPositionX,
    positionY: aPositionY,
  } = blockA.data;
  const {
    positionX: bPositionX,
    positionY: bPositionY,
  } = blockB.data;
  const dx = bPositionX - aPositionX;
  const dy = bPositionY - aPositionY;
  return Math.abs(dx) + Math.abs(dy) < 2;
}

export default class Swapper extends Group {
  constructor() {
    super(...arguments);
    this.data = {};
    this.setSwapTime();
  }
  setSwapTime(swapTime = 500) {
    this.data.swapTime = swapTime;
  }
  attachToBlockGrid(blockGrid) {
    this.data.blockGrid = blockGrid;
    
    blockGrid.onChildInputDown.add(block => this.holdBlock(block));
    blockGrid.onChildInputOver.add((block, pointer) => {
      if (this.children.length) {
        const lastBlock = last(this.children);
        // Issues:
        // - this is happening too fast. swiping 2 blocks over could trigger this before lastBlock starts animating, causing unnecessary queueBlocksInPath
        // - by the time queueBlocksInPath is running, lastBlock is animating, causing uneven cursor coordinates
        // - not always getting the appropriate blocks, swiping 2 to the right, then back will sometimes queue a block in another row
        //    - still need to figure this one out
        if (!('swappingTo' in lastBlock) && !blocksAreAdjacent(block, lastBlock)) {
          console.warn(`missed block (${lastBlock.data.positionX}, ${lastBlock.data.positionY}) => (${block.data.positionX}, ${block.data.positionY})
  pointer: (${pointer.x}, ${pointer.y})`);
          this.queueBlocksInPath(block, lastBlock, pointer);
        } else console.info(`(${lastBlock.data.positionX}, ${lastBlock.data.positionY}) => (${block.data.positionX}, ${block.data.positionY})`);
        this.queueToSwap(block, pointer);
      }
    });

    this.onChildInputOut.add((sprite, pointer) => {
      if (!blocksAreAdjacent(sprite, last(this.children))) {
          console.info('missed block');
      }
      // console.info('out', sprite.left, sprite.right, sprite.top, sprite.bottom, pointer.x, pointer.y);
    });
    
    blockGrid.game.input.onUp.add(() => this.releaseBlocks());
  }
  holdBlock(block) {
    this.addChild(block);
    block.data.held = true;
  }
  queueBlocksInPath(block, lastBlock, pointer) {
    console.info(`queuing towards (${block.x}, ${block.y}) ${!this.children.includes(block)}`);
    let cursor = new Point(lastBlock.x, lastBlock.y);
    let suppBlock = null;
    let loopCount = 0;
    while(loopCount < 10 && suppBlock !== block) {
      let dx = 0;
      let dy = 0;
      if (block.y < cursor.y) dy = -64;
      else if (block.y > cursor.y) dy = 64;
      else if (block.x < cursor.x) dx = -64;
      else if (block.x > cursor.x) dx = 64;
      cursor.set(cursor.x + dx, cursor.y + dy);
      if (cursor.x === block.x && cursor.y === block.y) break;
      loopCount++;
      console.info('cursor', cursor);
      suppBlock = this.data.blockGrid.getClosestTo(cursor, (testBlock) => {
        console.info(`closest (${testBlock.data.positionX}, ${testBlock.data.positionY}) ${!this.children.includes(testBlock)}`);
        return testBlock === block || !this.children.includes(testBlock);
      });
      this.queueToSwap(suppBlock);
      console.info(`added block (${suppBlock.data.positionX}, ${suppBlock.data.positionY})`);
    }
  }
  queueToSwap(block) {
    this.addChild(block);
    block.data.swappingTo = null;
  }
  releaseBlock(block) {
    delete block.data.held;
    delete block.data.swappingTo;
    this.data.blockGrid.addChild(block);
  }
  releaseBlocks() {
    var l = this.children.length;
    if (l) {
      this.forEach(block => delete block.data.swappingTo);
      delete this.children[0].data.held;
      this.moveAll(this.data.blockGrid);
      console.info(`moved back ${l} children`);
    }
  }
  processSwapQueue() {
    var [heldBlock, blockToSwap, ...blockQueue] = this.children;
    
    if (!heldBlock.data.swappingTo) {
      let heldBlockOriginalPositionX = heldBlock.data.positionX;
      let heldBlockOriginalPositionY = heldBlock.data.positionY;

      heldBlock.data.positionX = blockToSwap.data.positionX;
      heldBlock.data.positionY = blockToSwap.data.positionY;
      blockToSwap.data.positionX = heldBlockOriginalPositionX;
      blockToSwap.data.positionY = heldBlockOriginalPositionY;

      heldBlock.data.swappingTo = pixelCoordinatesForPosition(heldBlock.data.positionX, heldBlock.data.positionY);
      heldBlock.input.enabled = false;
      heldBlock.game.tweens.create(heldBlock)
        .to(heldBlock.data.swappingTo , this.data.swapTime, null, true)
        .onComplete.add((heldBlock) => {
          delete heldBlock.data.swappingTo;
          heldBlock.input.enabled = true;
        });
      blockToSwap.data.swappingTo = pixelCoordinatesForPosition(blockToSwap.data.positionX, blockToSwap.data.positionY);
      blockToSwap.input.enabled = false;
      blockToSwap.game.tweens.create(blockToSwap)
        .to(blockToSwap.data.swappingTo, this.data.swapTime, null, true)
        .onComplete.add((blockToSwap) => {
          this.releaseBlock(blockToSwap);
          blockToSwap.input.enabled = true;
        });
    }
  }
  update() {
    if (this.children.length > 1) {
      this.processSwapQueue();
    }
    super.update(...arguments);
  }
}
