#pragma strict



/* Controllers */
private var blockMover : BlockMovementController;
private var blockFactory : BlockFactoryController;
private var blockClearer : BlockClearingController;



/* Variables */
private var EDrive : EventCenter = Bloxxi.EDrive;



private var blockObjects : Array = [];
private var blockPrefab : GameObject;
private var mainCamera : Camera;
private var heldBlockObject : GameObject;
private var lastTouchedRow : int = -1;

private var queuedStabilizingBlocks : Array = [];
private var queuedClearingBlocks : Array = [];
private var queuedDroppingBlocks : Array = [];
private var queuedRisingBlocks : Array = [];

private var blockAnimationStep : float = 1 / Bloxxi.BLOCK_SWAP_SPEED;

private var risingOffset : float = 0.5;
private var setRisingSpeed : int = 60;
private var forcedRisingSpeed : int = 1;
private var risingSpeed : int = 1;
private var risingDistance : float = 0.1;
private var distanceLeftToRise : float = 0;
private var rowsRisen : int = 0;
private var forceRising : System.Boolean = false;

private var gameOver : System.Boolean = false;
// private var gameOver : System.Boolean = true;



/* Functions */
private function updateBlockType(blockObject : GameObject, blockType : BLOCK_TYPE) {
	if (!blockObject) {
		return;
	}
	updateBlockType(blockObject.GetComponent(Block), blockType);
}
private function updateBlockType(block : Block, blockType : BLOCK_TYPE) {
	block.type = blockType;
}


private function loadResources() {
	blockSprites = Resources.LoadAll("Sprites", typeof(Sprite));
	blockPrefab = Resources.Load("Block", typeof(GameObject)) as GameObject;
}
private function createInitialBlocks() {
	var ROW_COUNT : int = Bloxxi.ROW_COUNT;
	var COLUMN_COUNT : int = Bloxxi.COLUMN_COUNT;
	var ROWS_TO_BUILD : int = Bloxxi.INITIAL_NUMBER_OF_ROWS;
	var totalBlocksToBuild : int = COLUMN_COUNT * ROW_COUNT;

	for (var blockIterator : int = 0; blockIterator < totalBlocksToBuild; blockIterator++) {
		var row : int = Mathf.Floor(blockIterator / COLUMN_COUNT);
		var column : int = blockIterator % COLUMN_COUNT;

		if (row >= ROWS_TO_BUILD) {
			blockObjects.Add(null as GameObject);
			continue;
		}

		var blockObject : GameObject = createBlock(row, column) as GameObject;
		var	block : Block = blockObject.GetComponent(Block) as Block;
		var blockDown1 : Block = BlockAt(row - 1, column) as Block;
		var blockDown2 : Block = BlockAt(row - 2, column) as Block;
		var blockLeft1 : Block = BlockAt(row, column - 1) as Block;
		var blockLeft2 : Block = BlockAt(row, column - 2) as Block;

		while(
			(blockLeft1 != null && blockLeft2 != null && blockLeft1.type == block.type && blockLeft2.type == block.type) ||
			(blockDown1 != null && blockDown2 != null && blockDown1.type == block.type && blockDown2.type == block.type)
		) {
			block.setNewType();
		};

		blockObjects.Add(blockObject);
	}
}

private function createBlock(row : int, column : int) {
	var blockObject : GameObject = Instantiate(blockPrefab) as GameObject;
	var block : Block = blockObject.GetComponent(Block) as Block;
	block.row = row;
	block.column = column;

	blockObject.transform.parent = transform;
	blockObject.transform.position.x = column + transform.position.x;
	blockObject.transform.position.y = row + transform.position.y;

	return blockObject;
}

private function addRisenBlocksToBottomRow() {
	var highestRow : int = 0;
	for (var blocksIterator : int = 0; blocksIterator < blockObjects.length; blocksIterator++) {
		var blockObject : GameObject = blockObjects[blocksIterator] as GameObject;
		if (blockObject) {
			var block : Block = blockObject.GetComponent(Block) as Block;
			block.row++;
			if (block.row > highestRow) {
				highestRow = block.row;
			}
		}
	}

	for (var risingBlocksIterator : int = queuedRisingBlocks.length - 1; risingBlocksIterator > -1; risingBlocksIterator--) {
		var risingBlockObject : GameObject = queuedRisingBlocks[risingBlocksIterator] as GameObject;
		var risingBlock : Block = risingBlockObject.GetComponent(Block) as Block;

		risingBlock.setStableState();
		risingBlock.row = 0;

		blockObjects.Unshift(risingBlockObject);
	}

	queuedRisingBlocks = [];

	if (highestRow == Bloxxi.ROW_COUNT - 1) {
		gameOver = true;
	} else {
		checkMatches();
	}
}

private function touchHandler() {
	var dirtyPosition : Vector3 = mainCamera.ScreenToWorldPoint(Input.mousePosition);
	var row : int = Mathf.Floor(dirtyPosition.y + 0.5 - transform.position.y) + rowsRisen;
	var column : int = Mathf.Floor(dirtyPosition.x + 0.5 - transform.position.x);

	// Debug.Log(
	// 	"Raw mouse position: " + dirtyPosition +
	// 	"\nRising Offset: " + risingOffset +
	// 	"\nRows Risen: " + rowsRisen +
	// 	"\nBlocks Transform: " + transform.position +
	// 	"\nRow: " + row +
	// 	"\nColumn: " + column
	// );

	if (row < 0 || row >= Bloxxi.ROW_COUNT || column < 0 || column >= Bloxxi.COLUMN_COUNT) {
		return;
	}

	var blockObjectToSwap : GameObject = At(row, column) as GameObject;

	if (heldBlockObject != null) {
		lastTouchedRow = -1;
		Swap(heldBlockObject, blockObjectToSwap, Vector2(row, column));
	} else if (blockObjectToSwap != null) {
		lastTouchedRow = -1;
		heldBlockObject = blockObjectToSwap;
	} else if (lastTouchedRow != -1 && row > lastTouchedRow) {
		risingSpeed = forcedRisingSpeed;
		forceRising = true;
	} else if (!anyBlocksAbovePosition(row, column)) {
		lastTouchedRow = row;
	}
}

private function stablePositionForBlock(blockObject : GameObject) {
	var block : Block = blockObject.GetComponent(Block) as Block;
	var row : int = block.row;
	var column : int = block.column;

	return Vector3(column + transform.position.x, row + transform.position.y - rowsRisen, blockObject.transform.position.z);
}
private function animateBlockObjectToStablePosition(blockObject : GameObject) {
	if (!blockObject) {
		queuedStabilizingBlocks.Remove(blockObject);
		return;
	}
	var finalPosition : Vector3 = stablePositionForBlock(blockObject);
	blockObject.transform.position = Vector3.MoveTowards(blockObject.transform.position, finalPosition, blockAnimationStep);

	if (blockObject.transform.position == finalPosition) {
		var block : Block = blockObject.GetComponent(Block) as Block;
		queuedStabilizingBlocks.Remove(blockObject);
		var previousBlockState : BLOCK_STATE = block.state;
		if (previousBlockState != BLOCK_STATE.CLEAR && previousBlockState != BLOCK_STATE.DROP) {
			block.state = BLOCK_STATE.STABLE;
		}
		if (previousBlockState != BLOCK_STATE.DROP) {
			checkMatches();
		}
	}
}

private function checkMatches() {
	var blockCount : int = blockObjects.length;
	var blockObjectsToClear : Array = [];
	for (var blockIterator : int = 0; blockIterator < blockCount; blockIterator++) {
		var blockObject : GameObject = blockObjects[blockIterator];
		if (!blockObject) {
			continue;
		}

		var block = blockObject.GetComponent(Block) as Block;
		if (block.state == BLOCK_STATE.CLEAR) {
			continue;
		}

		var type : BLOCK_TYPE = block.type;
		var row : int = block.row;
		var column : int = block.column;

		var blockObjectUp1 : GameObject = At(row + 1, column) as GameObject;
		var blockUp1 : Block = blockObjectUp1 == null ? null : blockObjectUp1.GetComponent(Block) as Block;
		var blockObjectUp2 : GameObject = At(row + 2, column) as GameObject;
		var blockUp2 : Block = blockObjectUp2 == null ? null : blockObjectUp2.GetComponent(Block) as Block;
		var blockObjectRight1 : GameObject = At(row, column + 1) as GameObject;
		var blockRight1 : Block = blockObjectRight1 == null ? null : blockObjectRight1.GetComponent(Block) as Block;
		var blockObjectRight2 : GameObject = At(row, column + 2) as GameObject;
		var blockRight2 : Block = blockObjectRight2 == null ? null : blockObjectRight2.GetComponent(Block) as Block;

		if (
			blockUp1 != null && blockUp2 != null &&
			blockUp1.state != BLOCK_STATE.CLEAR && blockUp2.state != BLOCK_STATE.CLEAR &&
			type == blockUp1.type && type == blockUp2.type
		) {
			if (System.Array.IndexOf(blockObjectsToClear.ToBuiltin(GameObject), blockObject) == -1) {
				blockObjectsToClear.Add(blockObject);
			}
			if (System.Array.IndexOf(blockObjectsToClear.ToBuiltin(GameObject), blockObjectUp1) == -1) {
				blockObjectsToClear.Add(blockObjectUp1);
			}
			if (System.Array.IndexOf(blockObjectsToClear.ToBuiltin(GameObject), blockObjectUp2) == -1) {
				blockObjectsToClear.Add(blockObjectUp2);
			}
		}
		if (
			blockRight1 != null && blockRight2 != null &&
			blockRight1.state != BLOCK_STATE.CLEAR && blockRight2.state != BLOCK_STATE.CLEAR &&
			type == blockRight1.type && type == blockRight2.type
		) {
			if (System.Array.IndexOf(blockObjectsToClear.ToBuiltin(GameObject), blockObject) == -1) {
				blockObjectsToClear.Add(blockObject);
			}
			if (System.Array.IndexOf(blockObjectsToClear.ToBuiltin(GameObject), blockObjectRight1) == -1) {
				blockObjectsToClear.Add(blockObjectRight1);
			}
			if (System.Array.IndexOf(blockObjectsToClear.ToBuiltin(GameObject), blockObjectRight2) == -1) {
				blockObjectsToClear.Add(blockObjectRight2);
			}
		}
	}

	if (blockObjectsToClear.length > 0) {
		queueBlocksToAnimateClearing(blockObjectsToClear.ToBuiltin(GameObject));
	}
}
private function queueBlocksToAnimateClearing(blockObjectsToClear : GameObject[]) {
	var totalBlockObjectsToClear = blockObjectsToClear.length;
	for (var blockIterator : int = 0; blockIterator < totalBlockObjectsToClear; blockIterator++) {
		var blockObject : GameObject = blockObjectsToClear[blockIterator];
		var block : Block = blockObject.GetComponent(Block) as Block;

		block.setClearState();
		queuedClearingBlocks.Add(blockObject);
	}
}
private function animateClearingBlockObject(blockObject : GameObject) {
	if (blockObject == null) {
		var destroyedBlockIndex : int = IndexOf(blockObject);
		if (destroyedBlockIndex == -1) {
			queuedClearingBlocks.Remove(blockObject);
			return;
		}

		blockObjects[destroyedBlockIndex] = null;
		var destroyedBlockCoords : Vector2 = BlockCoordinatesOfIndex(destroyedBlockIndex);
		checkBlocksToDropAtCoordinates(destroyedBlockCoords.x, destroyedBlockCoords.y);
	} else {
		blockObject.animation.Play("BlockClearing");
	}
}

private function checkBlocksToDropAtCoordinates(row : int, column : int) {
	var checkBlockObject : GameObject = (At(row, column) || At(row + 1, column)) as GameObject;
	var checkBlock : Block;

	while (checkBlockObject != null) {
		checkBlock = checkBlockObject.GetComponent(Block) as Block;
		if (checkBlock == null) {
			break;
		}

		if (checkBlock.state == BLOCK_STATE.STABLE && System.Array.IndexOf(queuedDroppingBlocks.ToBuiltin(GameObject), checkBlockObject) == -1) {
			queuedDroppingBlocks.Add(checkBlockObject);
		} else {
			checkBlockObject = At(checkBlock.row + 1, column) as GameObject;
		}
	};
}
private function animateDroppingBlockObject(blockObject : GameObject) {
	if (blockObject == null) {
		queuedDroppingBlocks.Remove(blockObject);
		return;
	}
	if (System.Array.IndexOf(queuedStabilizingBlocks.ToBuiltin(GameObject), blockObject) != -1) {
		return;
	}

	var block : Block = blockObject.GetComponent(Block) as Block;
	var blockDown1 : Block = BlockAt(block.row - 1, block.column) as Block;
	if (blockDown1 != null && blockDown1.state != BLOCK_STATE.STABLE) {
		return;
	} else if (block.row == 0 || (blockDown1 != null && blockDown1.state == BLOCK_STATE.STABLE && block.row == blockDown1.row + 1)) {
		block.state = BLOCK_STATE.STABLE;
		queuedDroppingBlocks.Remove(blockObject);
		checkMatches();
	} else {
		block.state = BLOCK_STATE.DROP;

		var tileBeingReplaced : GameObject = blockObjects[IndexOfCoordinates(block.row + 1, block.column)] as GameObject;

		block.row = block.row - 1;
		blockObjects[IndexOf(blockObject)] = null as GameObject;
		blockObjects[IndexOfCoordinates(block.row, block.column)] = blockObject as GameObject;

		queuedStabilizingBlocks.Add(blockObject);
	}
}

private function anyBlocksAbovePosition(row : int, column : int) {
	for (var blocksIterator : int = 0; blocksIterator < blockObjects.length; blocksIterator++) {
		var blockObject : GameObject = blockObjects[blocksIterator] as GameObject;
		if (!blockObject) {
			continue;
		}
		var block : Block = blockObject.GetComponent(Block) as Block;
		if (block.column != column) {
			continue;
		} else if (block.row > row) {
			return true;
		}
	}

	return false;
}



/* Interface */
static var blockSprites : Object[];
public function IndexOf(blockObject : GameObject) {
	return System.Array.IndexOf(blockObjects.ToBuiltin(GameObject), blockObject);
}
public function BlockCoordinatesOfIndex(index : int) {
	if (index < 0 || index >= blockObjects.length) {
		return null;
	}

	return Vector2(Mathf.Floor(index / Bloxxi.COLUMN_COUNT), index % Bloxxi.COLUMN_COUNT);
}
public function IndexOfCoordinates(row : int, column : int) {
	if (row < 0 || column < 0 || column >= Bloxxi.COLUMN_COUNT) {
		return null;
	}
	var tryIndex : int = (row * Bloxxi.COLUMN_COUNT) + column;
	return tryIndex < 0 || blockObjects.length <= tryIndex ? null : tryIndex;
}
public function At(row : int, column : int) {
	if (row < 0 || column < 0 || column >= Bloxxi.COLUMN_COUNT) {
		return null;
	}
	var tryIndex : int = (row * Bloxxi.COLUMN_COUNT) + column;
	if (tryIndex < 0 || blockObjects.length <= tryIndex) {
		return null;
	} else {
		return blockObjects[tryIndex];
	}
}
public function BlockAt(row : int, column : int) {
	var blockObject : GameObject = At(row, column) as GameObject;
	return blockObject == null ? null : blockObject.GetComponent(Block) as Block;
}
public function Swap(swapFromBlockObject : GameObject, swapToBlockObject : GameObject, blockToSwapCoordinates : Vector2) {
	if (swapFromBlockObject == swapToBlockObject) {
		return;
	}

	var swapFromBlock : Block = swapFromBlockObject.GetComponent(Block) as Block;
	var swapToBlock : Block = null;
	if (swapToBlockObject != null) {
		swapToBlock = swapToBlockObject.GetComponent(Block) as Block;
	}

	if (
		swapFromBlock.state != BLOCK_STATE.STABLE ||
		(
			(swapToBlockObject != null && swapToBlock.state != BLOCK_STATE.STABLE) ||
			(swapToBlockObject == null && blockToSwapCoordinates == null)
		)
	) {
		return;
	}

	var swapToRow : int = swapToBlock == null ? blockToSwapCoordinates.x : swapToBlock.row ;
	var swapToColumn : int = swapToBlock == null ? blockToSwapCoordinates.y : swapToBlock.column;
	if (
		Mathf.Abs(swapFromBlock.row - swapToRow - swapFromBlock.column + swapToColumn) == 1 && 
		(
			(swapToBlockObject != null && swapFromBlock.row != swapToRow && swapFromBlock.column == swapToColumn) ||
			(swapFromBlock.column != swapToColumn && swapFromBlock.row == swapToRow)
		)
	) {

		//Model Swappage
		var swapFromIndex : int = IndexOf(swapFromBlockObject);
		var swapToIndex : int = swapToBlockObject == null ? IndexOfCoordinates(swapToRow, swapToColumn) : IndexOf(swapToBlockObject);
		blockObjects[swapFromIndex] = swapToBlockObject;
		blockObjects[swapToIndex] = swapFromBlockObject;
		var oldBlockPosition : Vector2 = Vector2(swapFromBlock.row, swapFromBlock.column);
		var newBlockPosition : Vector2 = Vector2(swapToRow, swapToColumn);
		if (swapToBlock != null) {
			swapToBlock.row = swapFromBlock.row;
			swapToBlock.column = swapFromBlock.column;
		}
		swapFromBlock.row = newBlockPosition.x;
		swapFromBlock.column = newBlockPosition.y;

		//Animation
		queuedStabilizingBlocks.Add(swapFromBlockObject);
		if (swapToBlock != null) {
			queuedStabilizingBlocks.Add(swapToBlockObject);
		}

		//Check clearing
		checkMatches();

		//Check drop
		checkBlocksToDropAtCoordinates(oldBlockPosition.x, oldBlockPosition.y);
		checkBlocksToDropAtCoordinates(swapToRow, swapToColumn);

		swapFromBlock.state = BLOCK_STATE.SWAP;
		if (swapToBlock != null) {
			swapToBlock.state = BLOCK_STATE.SWAP;
		}
	}
}
public function Rise() {
	if (gameOver) {
		return;
	}
	if (queuedStabilizingBlocks.length > 0 || queuedDroppingBlocks.length > 0 || queuedClearingBlocks.length > 0) {
		// Debug.Log(
		// 	"Stabilizing: " + queuedStabilizingBlocks.length +
		// 	"\nDropping: " + queuedDroppingBlocks.length +
		// 	"\nClearing: " + queuedClearingBlocks.length
		// );
		return;
	}

	if (!risingSpeed--) {
		risingSpeed = forceRising ? forcedRisingSpeed : setRisingSpeed;
		transform.position.y += risingDistance;
		risingOffset += risingDistance;
		distanceLeftToRise -= risingDistance;
		if (distanceLeftToRise <= 0) {
			distanceLeftToRise = Bloxxi.BLOCK_HEIGHT;
			if (queuedRisingBlocks.length > 0) {
				addRisenBlocksToBottomRow();
				rowsRisen++;
			}
			EDrive.Trigger("CREATE_ROW_OF_BLOCKS", -1);
			if (forceRising) {
				forceRising = false;
			}
		}
	}
}


function test(t) {
	queuedRisingBlocks = (t as Array).Concat(queuedRisingBlocks);
}
/* Listeners */
EDrive
	.Bind("SET_BLOCK_TYPE", updateBlockType)
	.Bind("CREATED_ROW_OF_BLOCKS", test)
;




/* Base Methods */
function Awake() {
	mainCamera = Camera.main;

	blockMover = gameObject.GetComponent(BlockMovementController) as BlockMovementController;
	blockFactory = gameObject.GetComponent(BlockFactoryController) as BlockFactoryController;
	blockClearer = gameObject.GetComponent(BlockClearingController) as BlockClearingController;


	loadResources();
}
function Start() {
	createInitialBlocks();
}
function Update() {
	for (var queuedClearingBlocksIterator : int = 0; queuedClearingBlocksIterator < queuedClearingBlocks.length; queuedClearingBlocksIterator++) {
		animateClearingBlockObject(queuedClearingBlocks[queuedClearingBlocksIterator]);
	}

	for (var queuedStabilizingBlocksIterator : int = 0; queuedStabilizingBlocksIterator < queuedStabilizingBlocks.length; queuedStabilizingBlocksIterator++) {
		animateBlockObjectToStablePosition(queuedStabilizingBlocks[queuedStabilizingBlocksIterator]);
	}

	for (var queuedDroppingBlocksIterator : int = 0; queuedDroppingBlocksIterator < queuedDroppingBlocks.length; queuedDroppingBlocksIterator++) {
		animateDroppingBlockObject(queuedDroppingBlocks[queuedDroppingBlocksIterator]);
	}

	if (!Input.GetButton("Fire1")) {
		heldBlockObject = null;
	} else {
		touchHandler();
	}

	Rise();
}
