#pragma strict



/**
	Private Sector
**/

/* Variables */
private var blockFactory : BlockFactoryController;
private var allBlockObjects : Array = [];
private var mainCamera : Camera;



/**
	Base Sector
**/

/* Init */
function init() {
	allBlockObjects = blockFactory.createInitialBlocks();
}



/* Delegate */
function Awake() {
	mainCamera = Camera.main;
	blockFactory = gameObject.GetComponent(BlockFactoryController) as BlockFactoryController;
}
function Start() {
	init();
}
