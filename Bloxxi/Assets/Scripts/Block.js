#pragma strict



/**
	Private Sector
**/

/* Variables */
private var spriteRenderer : SpriteRenderer;



/* Functions */
private function setType(newType : BLOCK_TYPE) {
	type = newType;
	spriteRenderer.sprite = BlocksController.blockSprites[newType] as Sprite;
}



/**
	Public Sector
**/

/* Properties */
public enum BLOCK_TYPE {
	HEART,
	DIAMOND,
	STAR,
	CIRCLE,
	TRIANGLE_UP,
	TRIANGLE_DOWN
};
public enum BLOCK_STATE {
	STABLE,
	SWAP,
	DROP,
	CLEAR,
	RISE
};
public var type : BLOCK_TYPE;
public var row : int;
public var column : int;
public var state : BLOCK_STATE = BLOCK_STATE.STABLE;



/* Methods */
public function setNewType(newType : BLOCK_TYPE) { //Set to specific type
	setType(newType);
}
public function setNewType() { //Sets to random type
	var typeIndex : int = Mathf.Round(Random.value * (Bloxxi.BLOCK_TYPE_COUNT - 1));
	setType(BLOCK_TYPE.GetValues(BLOCK_TYPE)[typeIndex]);
}

public function setRiseState() {
	state = BLOCK_STATE.RISE;
	spriteRenderer.color.r = spriteRenderer.color.g = spriteRenderer.color.b = 0.5;
}
public function setStableState() {
	state = BLOCK_STATE.STABLE;
	spriteRenderer.color.r = spriteRenderer.color.g = spriteRenderer.color.b = spriteRenderer.color.a = 1.0;
}
public function setClearState() {
	state = BLOCK_STATE.CLEAR;
	spriteRenderer.color.a = 0.5;
}

public function destroyBlock() {
	DestroyObject(gameObject);
}



/**
	Base Sector
**/

/* Delegate */
function Awake() {
	spriteRenderer = gameObject.GetComponent(SpriteRenderer);
	setNewType();
}
