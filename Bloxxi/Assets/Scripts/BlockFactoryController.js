#pragma strict



/* Variables */
private var EDrive : EventCenter = Bloxxi.EDrive;
private var blockPrefab : GameObject;
private var blockCache : Array = [];
private var COLUMN_COUNT : int = Bloxxi.COLUMN_COUNT;
private var rowsCreated : int = 0;



/* Functions */
private function init() {
	blockPrefab = Resources.Load("Block", typeof(GameObject)) as GameObject;

	EDrive.Trigger("BLOCK_FACTORY_INIT");
}
private function createBlock(row : int, column : int) {
	var useCache : System.Boolean = blockCache.length != 0;
	var blockObject : GameObject = useCache ? blockCache.Shift() : Instantiate(blockPrefab) as GameObject;
	var block : Block = blockObject.GetComponent(Block) as Block;
	block.row = row;
	block.column = column;

	blockObject.transform.parent = transform;
	blockObject.transform.position.x = column + transform.position.x;
	blockObject.transform.position.y = row + transform.position.y;

	if (row == -1) {
		block.setRiseState();
		blockObject.transform.position.y = (-Bloxxi.BLOCK_HEIGHT * (rowsCreated + 1)) + transform.position.y;
	}

	return blockObject;
}
private function createRowOfBlocks(row : int) {
	var rowOfBlocks : Array = [];
	var blockLeft1Type : BLOCK_TYPE = 0;
	var blockLeft2Type : BLOCK_TYPE = 0;
	for (var columnIterator : int = 0; columnIterator < COLUMN_COUNT; columnIterator++) {
		var newBlockObject : GameObject = createBlock(row, columnIterator);
		var newBlock : Block = newBlockObject.GetComponent(Block) as Block;

		while (blockLeft2Type && blockLeft1Type && blockLeft2Type == newBlock.type && blockLeft1Type == newBlock.type) {
			EDrive.Trigger("SET_BLOCK_TYPE", BLOCK_TYPE.GetValues(BLOCK_TYPE)[Mathf.Round(Random.value * (Bloxxi.BLOCK_TYPE_COUNT - 1))]);
		}

		if (blockLeft2Type == 0) {
			blockLeft2Type = newBlock.type;
		} else if (blockLeft1Type == 0) {
			blockLeft1Type = newBlock.type;
		} else {
			blockLeft2Type = blockLeft1Type;
			blockLeft1Type = newBlock.type;
		}

		rowOfBlocks.Add(newBlockObject);
	}

	rowsCreated++;

	EDrive.Trigger("CREATED_ROW_OF_BLOCKS", rowOfBlocks);
}



/* Listeners */
EDrive
	.Bind("CREATE_ROW_OF_BLOCKS", createRowOfBlocks)
;



/* Base Methods */
function Awake() {
	init();
}
