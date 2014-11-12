#pragma strict



/* Config */
//Play Area
static var COLUMN_COUNT : int = 6;
static var ROW_COUNT : int = 11;
static var INITIAL_NUMBER_OF_ROWS : int = 6;
// static var INITIAL_NUMBER_OF_ROWS : int = 1;
//Blocks
static var BLOCK_TYPE_COUNT : int = 6;
static var BLOCK_HEIGHT : float = 1;
static var BLOCK_SPRITE_PIXELS_TO_UNITS : float = 16;
static var BLOCK_SWAP_SPEED : float = 5;

static var EDrive : EventCenter = EventCenter();
