#pragma strict



/* Variables */
private var spriteRenderer : SpriteRenderer;



/* Functions */
private function setType() {
	var typeIndex : int = Mathf.Round(Random.value * (Bloxxi.BLOCK_TYPE_COUNT - 1));
	type = BLOCK_TYPE.GetValues(BLOCK_TYPE)[typeIndex];
	spriteRenderer.sprite = BlocksController.blockSprites[typeIndex] as Sprite;
}



/* Interface */
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
public function setNewType() { setType(); }
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
public function destroyBlock() { DestroyObject(gameObject); }



/* Base Methods */
function Awake() {
	spriteRenderer = gameObject.GetComponent(SpriteRenderer);
	setType();
}
