(function (Phaser) {
'use strict';

const BLOCK_TYPES = ['A', 'B', 'C', 'D', 'E', 'F'];

class BlockText extends Phaser.Text {
  constructor(game, blockType) {
    super(game, 0, 0, blockType, {
      fontSize: 64,
      fill: 'transparent',
      stroke: 'black',
      strokeThickness: 2,
    });
  }
}

class BlockGraphic extends Phaser.Graphics {
  constructor(game, blockType) {
    super(game, 0, 0);
    this.beginFill(0xffffff);
    this.drawRoundedRect(0, 0, 64, 64, 9);
    this.endFill();
    const text = new BlockText(game, blockType);
    this.addChild(text);
    text.alignIn(this, Phaser.CENTER);
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

class Block extends Phaser.Sprite {
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

function pixelCoordinatesForPosition(x, y) {
  //Account for offset (rise)
  return {
    x: x * 64,
    y: y * 64,
  };
}

class BlockGrid extends Phaser.Group {
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

/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array == null ? 0 : array.length;
  return length ? array[length - 1] : undefined;
}

var last_1 = last;

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

class Swapper extends Phaser.Group {
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
        const lastBlock = last_1(this.children);
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
      if (!blocksAreAdjacent(sprite, last_1(this.children))) {
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
    let cursor = new Phaser.Point(lastBlock.x, lastBlock.y);
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

class Board extends Phaser.Group {
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

class SinglePlayerGame extends Phaser.Group {
  constructor() {
    super(...arguments);
    const board = new Board(this.game, this);
  }
}

// import BlockFactory from 'objects/BlockFactory';
class PlayState extends Phaser.State {
  create() {
    const mainGroup = this.add.group(this.world, 'main');
    const singlePlayerGame = new SinglePlayerGame(this.game);
    
    // var blocks = new BlockFactory(this);
    // var cursorContainer = this.add.group(mainGroup, 'cursor container');
    
    mainGroup.add(singlePlayerGame);
  }
}

const BOARD_SIZE_WIDTH = 320;
const BOARD_SIZE_HEIGHT = 480;

class Game extends Phaser.Game {
  constructor(boardContainer) {
    super(
      BOARD_SIZE_WIDTH,
      BOARD_SIZE_HEIGHT,
      boardContainer,
      Phaser.AUTO,
    );
    
    this.state.add('play', PlayState);
    this.state.start('play');
  };
}

new Game(document.getElementById('board-container'));

}(Phaser));
